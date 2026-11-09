import { beforeEach, describe, expect, it, vi } from 'vitest'
import { crearCerrarSesion } from '@/modules/auth/application/cerrarSesion.ts'
import { crearIniciarSesion } from '@/modules/auth/application/iniciarSesion.ts'
import type { AuthRepository } from '@/modules/auth/application/ports/AuthRepository.ts'
import type { SesionStoragePort } from '@/modules/auth/application/ports/SesionStoragePort.ts'
import { crearRestaurarSesion } from '@/modules/auth/application/restaurarSesion.ts'
import type { Usuario } from '@/modules/auth/domain/Usuario.ts'
import { ErrorApi } from '@/shared/application/errores/ErrorApi.ts'

const USUARIO: Usuario = {
  id: 'u1',
  email: 'voluntario@comedor.test',
  nombreCompleto: 'Persona de Prueba',
  rol: 'VOLUNTARIO',
}

const TOKEN = 'token-de-prueba'

function crearAlmacen(tokenInicial: string | null = null): SesionStoragePort {
  let token = tokenInicial
  return {
    obtenerToken: () => token,
    guardarToken: (nuevo) => {
      token = nuevo
    },
    borrarToken: () => {
      token = null
    },
  }
}

describe('casos de uso de sesión', () => {
  let repositorio: AuthRepository

  beforeEach(() => {
    repositorio = {
      iniciarSesion: vi.fn().mockResolvedValue({ token: TOKEN, usuario: USUARIO }),
      consultarUsuarioActual: vi.fn().mockResolvedValue(USUARIO),
    }
  })

  function restaurar(almacen: SesionStoragePort) {
    return crearRestaurarSesion({ repositorio, almacen })()
  }

  describe('iniciarSesion', () => {
    const credenciales = { email: USUARIO.email, password: 'clave' }

    it('guarda el token y devuelve el usuario', async () => {
      const almacen = crearAlmacen()

      const usuario = await crearIniciarSesion({ repositorio, almacen })(credenciales)

      expect(usuario).toEqual(USUARIO)
      expect(almacen.obtenerToken()).toBe(TOKEN)
    })

    it('si el servidor rechaza no guarda nada', async () => {
      const rechazo = new ErrorApi({ tipo: 'no-autenticado', estado: 401 })
      vi.mocked(repositorio.iniciarSesion).mockRejectedValue(rechazo)
      const almacen = crearAlmacen()

      await expect(crearIniciarSesion({ repositorio, almacen })(credenciales)).rejects.toBe(rechazo)

      expect(almacen.obtenerToken()).toBeNull()
    })
  })

  describe('restaurarSesion', () => {
    it('sin token no consulta al servidor', async () => {
      await expect(restaurar(crearAlmacen())).resolves.toBeNull()

      expect(repositorio.consultarUsuarioActual).not.toHaveBeenCalled()
    })

    it('con token devuelve el usuario del servidor', async () => {
      await expect(restaurar(crearAlmacen(TOKEN))).resolves.toEqual(USUARIO)
    })

    it('si el servidor responde 401 borra el token', async () => {
      vi.mocked(repositorio.consultarUsuarioActual).mockRejectedValue(
        new ErrorApi({ tipo: 'no-autenticado', estado: 401 }),
      )
      const almacen = crearAlmacen(TOKEN)

      await expect(restaurar(almacen)).resolves.toBeNull()

      expect(almacen.obtenerToken()).toBeNull()
    })

    it('si falla la red conserva el token y propaga el error', async () => {
      const fallo = new ErrorApi({ tipo: 'red' })
      vi.mocked(repositorio.consultarUsuarioActual).mockRejectedValue(fallo)
      const almacen = crearAlmacen(TOKEN)

      await expect(restaurar(almacen)).rejects.toBe(fallo)

      expect(almacen.obtenerToken()).toBe(TOKEN)
    })
  })

  describe('cerrarSesion', () => {
    it('borra el token', () => {
      const almacen = crearAlmacen(TOKEN)

      crearCerrarSesion({ almacen })()

      expect(almacen.obtenerToken()).toBeNull()
    })
  })
})
