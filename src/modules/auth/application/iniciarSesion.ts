import type { Usuario } from '@/modules/auth/domain/Usuario.ts'
import type { AuthRepository, Credenciales } from './ports/AuthRepository.ts'
import type { SesionStoragePort } from './ports/SesionStoragePort.ts'

interface Dependencias {
  readonly repositorio: AuthRepository
  readonly almacen: SesionStoragePort
}

export type IniciarSesion = (credenciales: Credenciales) => Promise<Usuario>

export function crearIniciarSesion({ repositorio, almacen }: Dependencias): IniciarSesion {
  return async (credenciales) => {
    const { token, usuario } = await repositorio.iniciarSesion(credenciales)
    almacen.guardarToken(token)
    return usuario
  }
}
