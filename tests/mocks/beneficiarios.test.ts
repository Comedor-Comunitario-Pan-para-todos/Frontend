import { http, HttpResponse } from 'msw'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { BUSQUEDA_SERVIDOR_CAIDO, reiniciarBeneficiariosMock } from '@/mocks/beneficiarios.ts'
import { handlers, USUARIOS_MOCK } from '@/mocks/handlers.ts'
import type { Rol } from '@/modules/auth/domain/Usuario.ts'
import { BeneficiarioDuplicado } from '@/modules/beneficiarios/domain/BeneficiarioDuplicado.ts'
import type { NuevoBeneficiarioExtendido } from '@/modules/beneficiarios/domain/NuevoBeneficiario.ts'
import { BeneficiarioHttpRepository } from '@/modules/beneficiarios/infrastructure/http/BeneficiarioHttpRepository.ts'
import { AxiosHttpClient } from '@/shared/infrastructure/http/AxiosHttpClient.ts'
import { servidor } from './servidor.ts'

const TOTAL_INICIAL = 24

const NUEVA: NuevoBeneficiarioExtendido = {
  nivel: 'EXTENDIDO',
  nombres: 'Persona',
  apellidos: 'De Prueba',
  documento: { tipo: 'CC', numero: '99000111' },
  fechaNacimiento: '1990-01-31',
  barrio: 'El Jardín',
  telefono: '3151234567',
  clasificacion: { sistema: 'RUI', grupo: 'C12' },
}

const BASICOS = {
  nombres: 'Persona',
  apellidos: 'De Prueba',
  fechaNacimiento: '1990-01-31',
}

function tokenDe(rol: Rol): string {
  return `mock-token.${USUARIOS_MOCK.find((u) => u.rol === rol && u.activo)!.id}`
}

function crearHttp(token: string | null) {
  return new AxiosHttpClient({
    baseUrl: '/api',
    sesion: { obtenerToken: () => token, alExpirarSesion: vi.fn() },
  })
}

function crearRepositorio(rol: Rol = 'VOLUNTARIO') {
  return new BeneficiarioHttpRepository(crearHttp(tokenDe(rol)))
}

function todos(texto = '') {
  return crearRepositorio().buscar({ texto, pagina: 1, porPagina: 100 })
}

describe('mocks de beneficiarios', () => {
  beforeEach(() => {
    reiniciarBeneficiariosMock()
    servidor.use(...handlers)
  })

  describe('acceso', () => {
    it.each<Rol>(['COORDINADORA', 'VOLUNTARIO'])('%s puede consultar el padrón', async (rol) => {
      const pagina = await crearRepositorio(rol).buscar({ texto: '', pagina: 1, porPagina: 20 })

      expect(pagina.total).toBe(TOTAL_INICIAL)
    })

    it.each<Rol>(['PRESIDENTE_JAC', 'DONANTE'])('%s recibe 403 como en el backend', async (rol) => {
      await expect(
        crearRepositorio(rol).buscar({ texto: '', pagina: 1, porPagina: 20 }),
      ).rejects.toMatchObject({ tipo: 'sin-permiso' })
    })

    it('sin sesión recibe 401', async () => {
      const repositorio = new BeneficiarioHttpRepository(crearHttp(null))

      await expect(
        repositorio.buscar({ texto: '', pagina: 1, porPagina: 20 }),
      ).rejects.toMatchObject({ tipo: 'no-autenticado' })
    })
  })

  describe('búsqueda', () => {
    it('pagina el padrón, del registro más reciente al más antiguo', async () => {
      const repositorio = crearRepositorio()

      const primera = await repositorio.buscar({ texto: '', pagina: 1, porPagina: 20 })
      const segunda = await repositorio.buscar({ texto: '', pagina: 2, porPagina: 20 })

      expect(primera).toMatchObject({ total: TOTAL_INICIAL, pagina: 1, totalPaginas: 2 })
      expect(primera.beneficiarios).toHaveLength(20)
      expect(segunda.beneficiarios).toHaveLength(TOTAL_INICIAL - 20)
      expect(primera.beneficiarios[0]).toMatchObject({ nombres: 'María Elena' })
    })

    it.each([
      ['parte del nombre', 'elena', ['María Elena Restrepo']],
      ['el apellido sin tilde', 'martinez', ['Rosa Martínez de Osorio']],
      ['parte del documento', '4218539', ['María Elena Restrepo']],
      [
        'un apellido compartido',
        'bedoya lópez',
        ['Yeison Andrés Bedoya López', 'Ana Sofía Bedoya López'],
      ],
    ])('encuentra por %s', async (_caso, texto, esperados) => {
      const { beneficiarios } = await todos(texto)

      expect(beneficiarios.map((b) => `${b.nombres} ${b.apellidos}`)).toEqual(esperados)
    })

    it('igual que el backend, no encuentra nombre y apellido escritos juntos', async () => {
      await expect(todos('María Elena Restrepo')).resolves.toMatchObject({ total: 0 })
    })

    it('rechaza un parámetro que el backend no conoce', async () => {
      const respuesta = crearHttp(tokenDe('VOLUNTARIO')).get('/beneficiarios', {
        params: { busqueda: 'maría' },
      })

      await expect(respuesta).rejects.toMatchObject({
        mensajesServidor: ['property busqueda should not exist'],
      })
    })

    it('puede simular una caída del servidor', async () => {
      await expect(todos(BUSQUEDA_SERVIDOR_CAIDO)).rejects.toMatchObject({ tipo: 'servidor' })
    })
  })

  describe('registro', () => {
    it('agrega a la persona al inicio del padrón, con todos sus datos', async () => {
      const repositorio = crearRepositorio()

      const ficha = await repositorio.registrar(NUEVA)
      const pagina = await repositorio.buscar({ texto: '', pagina: 1, porPagina: 20 })

      expect(ficha).toMatchObject(NUEVA)
      expect(pagina.total).toBe(TOTAL_INICIAL + 1)
      expect(pagina.beneficiarios[0]).toEqual(ficha)
      await expect(repositorio.consultarPorId(ficha.id)).resolves.toEqual(ficha)
    })

    it('registra en nivel básico sin datos sensibles', async () => {
      const ficha = await crearRepositorio().registrar({
        ...BASICOS,
        nivel: 'BASICO',
        barrio: null,
      })

      expect(ficha).toMatchObject({ nivel: 'BASICO', documento: null, telefono: null })
    })

    it('acepta a varias personas sin documento', async () => {
      const repositorio = crearRepositorio()
      const sinDocumento = { ...NUEVA, documento: null }

      await repositorio.registrar(sinDocumento)
      const segunda = await repositorio.registrar({ ...sinDocumento, nombres: 'Otra Persona' })

      expect(segunda.documento).toBeNull()
    })

    it('rechaza un documento que ya está registrado', async () => {
      const repetida = { ...NUEVA, documento: { tipo: 'CC', numero: '42185390' } }

      const error = await crearRepositorio()
        .registrar(repetida)
        .catch((capturado: unknown) => capturado)

      expect(error).toBeInstanceOf(BeneficiarioDuplicado)
    })

    it.each([
      [
        'los campos obligatorios',
        { ...BASICOS, nivel: 'BASICO', nombres: '', fechaNacimiento: '31/01/1990' },
        [
          'Los nombres son requeridos',
          'La fecha de nacimiento debe tener formato válido AAAA-MM-DD',
        ],
      ],
      ['el nivel', BASICOS, ['El nivel debe ser BASICO o EXTENDIDO']],
      [
        'un campo desconocido',
        { ...BASICOS, nivel: 'BASICO', consentimiento: true },
        ['property consentimiento should not exist'],
      ],
      [
        'datos sensibles en nivel básico',
        { ...BASICOS, nivel: 'BASICO', telefono: '3151234567' },
        ['property telefono should not exist in nivel BASICO'],
      ],
      [
        'una clasificación fuera de la escala',
        { ...BASICOS, nivel: 'EXTENDIDO', clasificacion: { sistema: 'RUI', grupo: 'E1' } },
        ['El grupo de clasificación debe estar entre A1 y D21'],
      ],
    ])('valida %s con los mensajes del backend', async (_caso, cuerpo, mensajes) => {
      const respuesta = crearHttp(tokenDe('VOLUNTARIO')).post('/beneficiarios', cuerpo)

      await expect(respuesta).rejects.toMatchObject({
        tipo: 'validacion',
        mensajesServidor: mensajes,
      })
    })

    it('el padrón vuelve a su estado inicial al reiniciarlo', async () => {
      await crearRepositorio().registrar(NUEVA)

      reiniciarBeneficiariosMock()

      await expect(todos()).resolves.toMatchObject({ total: TOTAL_INICIAL })
    })
  })

  describe('consulta de una ficha', () => {
    it('responde 404 si la persona no existe', async () => {
      const inexistente = '00000000-0000-4000-8000-999999999999'

      await expect(crearRepositorio().consultarPorId(inexistente)).rejects.toMatchObject({
        tipo: 'no-encontrado',
      })
    })

    it('responde 400 si el id no es un UUID, como el backend', async () => {
      await expect(crearRepositorio().consultarPorId('abc')).rejects.toMatchObject({
        tipo: 'validacion',
      })
    })
  })

  describe('pantallas de la app en las mismas direcciones', () => {
    // La app tiene pantallas en /beneficiarios y /beneficiarios/:id. Si el mock respondiera
    // también a la carga de la página, recargar en `pnpm dev:mock` mostraría un 401.
    it.each(['/beneficiarios', '/beneficiarios/nuevo', '/beneficiarios/validar-documento/1'])(
      'deja pasar la carga de la página %s',
      async (ruta) => {
        servidor.use(
          ...handlers,
          http.get(`*${ruta}`, () => HttpResponse.html('<p>La aplicación</p>')),
        )

        const respuesta = await fetch(`http://localhost${ruta}`, {
          headers: { Accept: 'text/html,application/xhtml+xml' },
        })

        await expect(respuesta.text()).resolves.toBe('<p>La aplicación</p>')
      },
    )
  })
})
