import { http, HttpResponse } from 'msw'
import { describe, expect, it, vi } from 'vitest'
import { AuthHttpRepository } from '@/modules/auth/infrastructure/http/AuthHttpRepository.ts'
import { AxiosHttpClient } from '@/shared/infrastructure/http/AxiosHttpClient.ts'
import { servidor } from '../../../../mocks/servidor.ts'

const USUARIO = {
  id: '6f1c2b1e-0000-4000-8000-000000000001',
  email: 'voluntario@comedor.test',
  nombreCompleto: 'Persona de Prueba',
  rol: 'VOLUNTARIO',
}

const CREDENCIALES = { email: USUARIO.email, password: 'clave' }

function crearRepositorio(token: string | null = null) {
  return new AuthHttpRepository(
    new AxiosHttpClient({
      baseUrl: '/api',
      sesion: { obtenerToken: () => token, alExpirarSesion: vi.fn() },
    }),
  )
}

describe('AuthHttpRepository', () => {
  it('inicia sesión con las credenciales y traduce accessToken a token', async () => {
    let cuerpo: unknown
    servidor.use(
      http.post('*/api/auth/login', async ({ request }) => {
        cuerpo = await request.json()
        return HttpResponse.json({ accessToken: 'jwt', usuario: USUARIO })
      }),
    )

    const sesion = await crearRepositorio().iniciarSesion(CREDENCIALES)

    expect(cuerpo).toEqual(CREDENCIALES)
    expect(sesion).toEqual({ token: 'jwt', usuario: USUARIO })
  })

  it('el login no envía un token anterior', async () => {
    let autorizacion: string | null = 'sin leer'
    servidor.use(
      http.post('*/api/auth/login', ({ request }) => {
        autorizacion = request.headers.get('Authorization')
        return HttpResponse.json({ accessToken: 'jwt', usuario: USUARIO })
      }),
    )

    await crearRepositorio('token-viejo').iniciarSesion(CREDENCIALES)

    expect(autorizacion).toBeNull()
  })

  it('consulta el usuario actual y descarta los campos que no usa', async () => {
    servidor.use(http.get('*/api/auth/me', () => HttpResponse.json({ ...USUARIO, activo: true })))

    await expect(crearRepositorio('jwt').consultarUsuarioActual()).resolves.toEqual(USUARIO)
  })

  it('un rol desconocido es una respuesta inválida', async () => {
    servidor.use(
      http.get('*/api/auth/me', () => HttpResponse.json({ ...USUARIO, rol: 'ADMINISTRADOR' })),
    )

    await expect(crearRepositorio('jwt').consultarUsuarioActual()).rejects.toMatchObject({
      tipo: 'respuesta-invalida',
    })
  })
})
