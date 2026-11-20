import type { Beneficiario } from './Beneficiario.ts'
import { esMenorDeEdad } from './edad.ts'

export type EstadoUsoImagen = 'AUTORIZADA' | 'NO_AUTORIZADA' | 'REQUIERE_TUTOR'

/** Sin autorización vigente no hay fotos (RNF-11). A un menor la autoriza su tutor (RF-21). */
export function estadoUsoImagen(
  beneficiario: Pick<Beneficiario, 'consentimientoImagen' | 'fechaNacimiento'>,
  hoy: string,
): EstadoUsoImagen {
  if (beneficiario.consentimientoImagen) return 'AUTORIZADA'
  if (esMenorDeEdad(beneficiario.fechaNacimiento, hoy)) return 'REQUIERE_TUTOR'
  return 'NO_AUTORIZADA'
}
