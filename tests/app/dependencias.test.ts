import { http, HttpResponse } from 'msw'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { crearDependencias } from '@/app/dependencias.ts'
import { reiniciarBeneficiariosMock } from '@/mocks/beneficiarios.ts'
import { CLAVE_MOCK, handlers } from '@/mocks/handlers.ts'
import { BeneficiarioDuplicado } from '@/modules/beneficiarios/domain/BeneficiarioDuplicado.ts'
import { servidor } from '../mocks/servidor.ts'

const USUARIO = {
  id: '6f1c2b1e-0000-4000-8000-000000000001',
  email: 'coordinadora@comedor.test',
  nombreCompleto: 'Persona de Prueba',
  rol: 'COORDINADORA',
}

const CREDENCIALES = { email: USUARIO.email, password: 'clave' }

function responderLogin() {
  servidor.use(
    http.post('*/api/auth/login', () =>
      HttpResponse.json({ accessToken: 'jwt-de-prueba', usuario: USUARIO }),
    ),
  )
}

describe('crearDependencias', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('después del login, restaurar la sesión envía el token guardado', async () => {
    let autorizacion: string | null = null
    responderLogin()
    servidor.use(
      http.get('*/api/auth/me', ({ request }) => {
        autorizacion = request.headers.get('Authorization')
        return HttpResponse.json({ ...USUARIO, activo: true })
      }),
    )
    const { iniciarSesion, restaurarSesion } = crearDependencias({ apiBaseUrl: '/api' })

    await iniciarSesion(CREDENCIALES)

    await expect(restaurarSesion()).resolves.toEqual(USUARIO)
    expect(autorizacion).toBe('Bearer jwt-de-prueba')
  })

  it('un 401 al restaurar deja la app sin sesión', async () => {
    responderLogin()
    servidor.use(
      http.get('*/api/auth/me', () =>
        HttpResponse.json({ statusCode: 401, message: 'Unauthorized' }, { status: 401 }),
      ),
    )
    const { iniciarSesion, restaurarSesion } = crearDependencias({ apiBaseUrl: '/api' })
    await iniciarSesion(CREDENCIALES)

    await expect(restaurarSesion()).resolves.toBeNull()
    await expect(restaurarSesion()).resolves.toBeNull()
  })

  it('un 401 con el token vigente avisa a quien esté suscrito, y deja de avisar al cancelar', async () => {
    responderLogin()
    servidor.use(
      http.get('*/api/auth/me', () =>
        HttpResponse.json({ statusCode: 401, message: 'Unauthorized' }, { status: 401 }),
      ),
    )
    const { iniciarSesion, restaurarSesion, suscribirExpiracion } = crearDependencias({
      apiBaseUrl: '/api',
    })
    const oyente = vi.fn()
    const cancelar = suscribirExpiracion(oyente)
    await iniciarSesion(CREDENCIALES)

    await restaurarSesion()

    expect(oyente).toHaveBeenCalledTimes(1)

    cancelar()
    await iniciarSesion(CREDENCIALES)
    await restaurarSesion()

    expect(oyente).toHaveBeenCalledTimes(1)
  })

  it('cerrar sesión impide restaurarla sin consultar al servidor', async () => {
    responderLogin()
    const { iniciarSesion, restaurarSesion, cerrarSesion } = crearDependencias({
      apiBaseUrl: '/api',
    })
    await iniciarSesion(CREDENCIALES)

    cerrarSesion()

    await expect(restaurarSesion()).resolves.toBeNull()
  })

  describe('beneficiarios', () => {
    async function entrarComoVoluntario() {
      reiniciarBeneficiariosMock()
      servidor.use(...handlers)
      const dependencias = crearDependencias({ apiBaseUrl: '/api' })
      await dependencias.iniciarSesion({ email: 'voluntario@comedor.test', password: CLAVE_MOCK })
      return dependencias
    }

    it('los casos de uso comparten la sesión: buscan con el token del login', async () => {
      const { buscarBeneficiarios } = await entrarComoVoluntario()

      const pagina = await buscarBeneficiarios({ texto: '42.185.390' })

      expect(pagina.beneficiarios).toMatchObject([{ nombres: 'María Elena' }])
    })

    it('sin sesión el servidor rechaza la búsqueda', async () => {
      servidor.use(...handlers)
      const { buscarBeneficiarios } = crearDependencias({ apiBaseUrl: '/api' })

      await expect(buscarBeneficiarios()).rejects.toMatchObject({ tipo: 'no-autenticado' })
    })

    it('registra, consulta la ficha y luego avisa del duplicado', async () => {
      const { registrarBeneficiario, consultarBeneficiario, verificarDuplicado } =
        await entrarComoVoluntario()

      const ficha = await registrarBeneficiario({
        nombres: ' Persona ',
        apellidos: 'De Prueba',
        documento: { tipo: 'CC', numero: '99.000.111' },
        fechaNacimiento: '1990-01-31',
        barrio: '',
      })

      expect(ficha).toMatchObject({
        nombres: 'Persona',
        documento: { tipo: 'CC', numero: '99000111' },
        barrio: null,
      })
      await expect(consultarBeneficiario(ficha.id)).resolves.toEqual(ficha)
      await expect(verificarDuplicado({ numeroDocumento: '99000111' })).resolves.toEqual({
        motivo: 'documento',
        beneficiario: ficha,
      })
    })

    it('registrar un documento repetido lanza BeneficiarioDuplicado', async () => {
      const { registrarBeneficiario } = await entrarComoVoluntario()

      await expect(
        registrarBeneficiario({
          nombres: 'María Elena',
          apellidos: 'Restrepo',
          documento: { tipo: 'CC', numero: '42185390' },
          fechaNacimiento: '1958-03-15',
          barrio: null,
        }),
      ).rejects.toBeInstanceOf(BeneficiarioDuplicado)
    })
  })
})
