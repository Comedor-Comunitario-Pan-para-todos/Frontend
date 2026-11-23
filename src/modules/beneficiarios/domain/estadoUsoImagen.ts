import type { Beneficiario } from './Beneficiario.ts'
import { eraMayorDeEdad, esMenorDeEdad } from './edad.ts'

export type EstadoUsoImagen = 'AUTORIZADA' | 'NO_AUTORIZADA' | 'REQUIERE_TUTOR'

type DatosImagen = Pick<
  Beneficiario,
  'consentimientoImagen' | 'fechaNacimiento' | 'autorizacionTutor'
>

/** Sin autorización vigente no hay fotos (RNF-11). A un menor la autoriza su tutor (RF-21). */
export function estadoUsoImagen(beneficiario: DatosImagen, hoy: string): EstadoUsoImagen {
  const { fechaNacimiento, consentimientoImagen, autorizacionTutor } = beneficiario
  if (esMenorDeEdad(fechaNacimiento, hoy)) {
    if (autorizacionTutor?.estado !== 'ACTIVA') return 'REQUIERE_TUTOR'
    return consentimientoImagen ? 'AUTORIZADA' : 'NO_AUTORIZADA'
  }
  if (consentimientoImagen && eraMayorDeEdad(fechaNacimiento, consentimientoImagen.registradoEn)) {
    return 'AUTORIZADA'
  }
  return 'NO_AUTORIZADA'
}
