import { createContext, useContext } from 'react'
import type { Credenciales } from '@/modules/auth/application/ports/AuthRepository.ts'
import type { Usuario } from '@/modules/auth/domain/Usuario.ts'

export type EstadoSesion = 'cargando' | 'error' | 'anonimo' | 'autenticado'

export interface Auth {
  readonly estado: EstadoSesion
  readonly usuario: Usuario | null
  readonly error: unknown
  readonly verificando: boolean
  readonly cerroSesion: boolean
  reintentar(): void
  iniciarSesion(credenciales: Credenciales): Promise<void>
  cerrarSesion(): void
}

export const ContextoAuth = createContext<Auth | null>(null)

export function useAuth(): Auth {
  const auth = useContext(ContextoAuth)
  if (auth === null) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return auth
}
