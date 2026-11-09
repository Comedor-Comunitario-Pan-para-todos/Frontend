import { delay, http, HttpResponse } from 'msw'
import type { Rol } from '@/modules/auth/domain/Usuario.ts'

export const CLAVE_MOCK = 'Comedor123*'

// Fuerza un error 500 al iniciar sesión, para probar esa pantalla.
export const EMAIL_SERVIDOR_CAIDO = 'caida@comedor.test'

interface UsuarioMock {
  readonly id: string
  readonly email: string
  readonly nombreCompleto: string
  readonly rol: Rol
  readonly activo: boolean
}

function usuario(id: string, email: string, nombreCompleto: string, rol: Rol, activo = true) {
  return { id, email, nombreCompleto, rol, activo } satisfies UsuarioMock
}

export const USUARIOS_MOCK: readonly UsuarioMock[] = [
  usuario('mock-1', 'coordinadora@comedor.test', 'Coordinación de Prueba', 'COORDINADORA'),
  usuario('mock-2', 'presidente@comedor.test', 'Presidencia JAC de Prueba', 'PRESIDENTE_JAC'),
  usuario('mock-3', 'voluntario@comedor.test', 'Voluntario de Prueba', 'VOLUNTARIO'),
  usuario('mock-4', 'donante@comedor.test', 'Donante de Prueba', 'DONANTE'),
  usuario('mock-5', 'inactivo@comedor.test', 'Usuario Inactivo', 'VOLUNTARIO', false),
]

function noAutorizado(mensaje: string) {
  return HttpResponse.json(
    { statusCode: 401, message: mensaje, error: 'Unauthorized' },
    { status: 401 },
  )
}

function buscarPorToken(autorizacion: string | null) {
  return USUARIOS_MOCK.find((u) => autorizacion === `Bearer mock-token.${u.id}`)
}

export const handlers = [
  http.post('*/auth/login', async ({ request }) => {
    await delay()
    const { email, password } = (await request.json()) as { email: string; password: string }

    if (email === EMAIL_SERVIDOR_CAIDO) {
      return HttpResponse.json(
        { statusCode: 500, message: 'Internal server error' },
        { status: 500 },
      )
    }

    const encontrado = USUARIOS_MOCK.find((u) => u.email === email)
    if (!encontrado) return noAutorizado('Credenciales inválidas')
    if (!encontrado.activo) return noAutorizado('El usuario se encuentra inactivo')
    if (password !== CLAVE_MOCK) return noAutorizado('Credenciales inválidas')

    const { activo: _activo, ...datos } = encontrado
    return HttpResponse.json({ accessToken: `mock-token.${encontrado.id}`, usuario: datos })
  }),

  http.get('*/auth/me', async ({ request }) => {
    await delay()
    const encontrado = buscarPorToken(request.headers.get('Authorization'))
    return encontrado ? HttpResponse.json(encontrado) : noAutorizado('Unauthorized')
  }),
]
