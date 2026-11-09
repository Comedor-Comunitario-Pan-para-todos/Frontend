import { beforeEach, describe, expect, it } from 'vitest'
import { crearDependencias } from '@/app/dependencias.ts'
import { CLAVE_MOCK, EMAIL_SERVIDOR_CAIDO, handlers, USUARIOS_MOCK } from '@/mocks/handlers.ts'
import { ROLES } from '@/modules/auth/domain/Usuario.ts'
import { servidor } from './servidor.ts'

function crear() {
  servidor.use(...handlers)
  return crearDependencias({ apiBaseUrl: '/api' })
}

describe('mocks de autenticación', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it.each(ROLES)('entra con un usuario de rol %s y restaura la sesión', async (rol) => {
    const { email } = USUARIOS_MOCK.find((u) => u.rol === rol && u.activo)!
    const { iniciarSesion, restaurarSesion } = crear()

    const usuario = await iniciarSesion({ email, password: CLAVE_MOCK })

    expect(usuario.rol).toBe(rol)
    await expect(restaurarSesion()).resolves.toEqual(usuario)
  })

  it.each([
    ['una clave incorrecta', 'voluntario@comedor.test', 'otra-clave', 'Credenciales inválidas'],
    ['un correo desconocido', 'nadie@comedor.test', CLAVE_MOCK, 'Credenciales inválidas'],
    [
      'un usuario inactivo',
      'inactivo@comedor.test',
      CLAVE_MOCK,
      'El usuario se encuentra inactivo',
    ],
  ])('rechaza %s como el backend', async (_caso, email, password, mensaje) => {
    await expect(crear().iniciarSesion({ email, password })).rejects.toMatchObject({
      tipo: 'no-autenticado',
      mensajesServidor: [mensaje],
    })
  })

  it('puede simular una caída del servidor', async () => {
    await expect(
      crear().iniciarSesion({ email: EMAIL_SERVIDOR_CAIDO, password: CLAVE_MOCK }),
    ).rejects.toMatchObject({ tipo: 'servidor' })
  })
})
