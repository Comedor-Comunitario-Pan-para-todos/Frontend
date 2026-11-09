import type { Usuario } from '@/modules/auth/domain/Usuario.ts'

export interface Credenciales {
  readonly email: string
  readonly password: string
}

export interface SesionIniciada {
  readonly token: string
  readonly usuario: Usuario
}

export interface AuthRepository {
  iniciarSesion(credenciales: Credenciales): Promise<SesionIniciada>
  consultarUsuarioActual(): Promise<Usuario>
}
