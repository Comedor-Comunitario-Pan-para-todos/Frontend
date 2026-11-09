import type { ReactNode } from 'react'
import { tienePermiso, type Permiso } from '@/modules/auth/domain/permisos.ts'
import { useAuth } from './contextoAuth.ts'

interface PropsConPermiso {
  readonly permiso: Permiso
  readonly alternativa?: ReactNode
  readonly children: ReactNode
}

export function ConPermiso({ permiso, alternativa = null, children }: PropsConPermiso) {
  const { usuario } = useAuth()

  return tienePermiso(usuario, permiso) ? children : alternativa
}
