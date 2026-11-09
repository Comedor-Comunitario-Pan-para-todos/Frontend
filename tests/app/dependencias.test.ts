import { http, HttpResponse } from 'msw'
import { beforeEach, describe, expect, it } from 'vitest'
import { crearDependencias } from '@/app/dependencias.ts'
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

  it('cerrar sesión impide restaurarla sin consultar al servidor', async () => {
    responderLogin()
    const { iniciarSesion, restaurarSesion, cerrarSesion } = crearDependencias({
      apiBaseUrl: '/api',
    })
    await iniciarSesion(CREDENCIALES)

    cerrarSesion()

    await expect(restaurarSesion()).resolves.toBeNull()
  })
})
