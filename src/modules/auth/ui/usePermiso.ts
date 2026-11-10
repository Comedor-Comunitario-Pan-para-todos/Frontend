import { tienePermiso, type Permiso } from '@/modules/auth/domain/permisos.ts'
import { useAuth } from './contextoAuth.ts'

/** Dice si quien tiene la sesión abierta puede hacer algo. Sin sesión, nunca puede. */
export function usePermiso(permiso: Permiso): boolean {
  const { usuario } = useAuth()

  return tienePermiso(usuario, permiso)
}
