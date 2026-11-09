import { ROLES, type Rol, type Usuario } from './Usuario.ts'

export type Permiso =
  | 'inicio.ver'
  | 'turnos.ver'
  | 'beneficiarios.ver'
  | 'inventario.ver'
  | 'aportes.ver'
  | 'reportes.ver'

const MATRIZ: Record<Permiso, readonly Rol[]> = {
  'inicio.ver': ROLES,
  'turnos.ver': ['COORDINADORA', 'VOLUNTARIO'],
  'beneficiarios.ver': ['COORDINADORA', 'VOLUNTARIO'],
  'inventario.ver': ['COORDINADORA', 'VOLUNTARIO'],
  'aportes.ver': ['DONANTE'],
  'reportes.ver': ['COORDINADORA', 'PRESIDENTE_JAC', 'DONANTE'],
}

export function tienePermiso(usuario: Usuario | null, permiso: Permiso): boolean {
  return usuario !== null && MATRIZ[permiso].includes(usuario.rol)
}
