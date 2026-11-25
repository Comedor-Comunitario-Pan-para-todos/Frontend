import { ROLES, type Rol, type Usuario } from './Usuario.ts'

export type Permiso =
  | 'inicio.ver'
  | 'turnos.ver'
  | 'beneficiarios.ver'
  | 'beneficiarios.registrar'
  /** Ver completos el documento y el teléfono de un beneficiario (RNF-07). */
  | 'beneficiarios.verDatosSensibles'
  /** Cambiar documento, teléfono y clasificación de quien ya tiene registro extendido. */
  | 'beneficiarios.actualizarDatosSensibles'
  /** Aprobar o revocar al tutor de un menor y autorizar el uso de su imagen (RF-21). */
  | 'beneficiarios.gestionarTutor'
  | 'inventario.ver'
  | 'aportes.ver'
  | 'reportes.ver'
  /** Leer la guía de inducción y marcar los temas leídos (RF-15). */
  | 'induccion.ver'
  /** Descargar el padrón de beneficiarios para la Alcaldía: lo entrega el Presidente de la JAC (RF-18, HU-22). */
  | 'reportes.exportarPadron'

const MATRIZ: Record<Permiso, readonly Rol[]> = {
  'inicio.ver': ROLES,
  'turnos.ver': ['COORDINADORA', 'VOLUNTARIO'],
  'beneficiarios.ver': ['COORDINADORA', 'VOLUNTARIO'],
  'beneficiarios.registrar': ['COORDINADORA', 'VOLUNTARIO'],
  'beneficiarios.verDatosSensibles': ['COORDINADORA'],
  'beneficiarios.actualizarDatosSensibles': ['COORDINADORA'],
  'beneficiarios.gestionarTutor': ['COORDINADORA'],
  'inventario.ver': ['COORDINADORA', 'VOLUNTARIO'],
  'aportes.ver': ['DONANTE'],
  'reportes.ver': ['COORDINADORA', 'PRESIDENTE_JAC', 'DONANTE'],
  'induccion.ver': ['COORDINADORA', 'VOLUNTARIO'],
  'reportes.exportarPadron': ['PRESIDENTE_JAC'],
}

export function tienePermiso(usuario: Usuario | null, permiso: Permiso): boolean {
  return usuario !== null && MATRIZ[permiso].includes(usuario.rol)
}
