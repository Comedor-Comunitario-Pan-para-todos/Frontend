import type { Usuario } from '@/modules/auth/domain/Usuario.ts'
import { esErrorApi } from '@/shared/application/errores/ErrorApi.ts'
import type { AuthRepository } from './ports/AuthRepository.ts'
import type { SesionStoragePort } from './ports/SesionStoragePort.ts'

interface Dependencias {
  readonly repositorio: AuthRepository
  readonly almacen: SesionStoragePort
}

export type RestaurarSesion = () => Promise<Usuario | null>

export function crearRestaurarSesion({ repositorio, almacen }: Dependencias): RestaurarSesion {
  return async () => {
    if (almacen.obtenerToken() === null) return null

    try {
      return await repositorio.consultarUsuarioActual()
    } catch (error) {
      // Una caída de red no invalida la sesión: el token se conserva para reintentar.
      if (esErrorApi(error) && error.tipo === 'no-autenticado') {
        almacen.borrarToken()
        return null
      }
      throw error
    }
  }
}
