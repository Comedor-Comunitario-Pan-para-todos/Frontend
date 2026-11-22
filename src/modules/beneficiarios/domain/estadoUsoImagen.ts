import { fechaDeHoy } from '@/shared/domain/fechaDeHoy.ts'
import type { Beneficiario } from './Beneficiario.ts'
import type { Consentimiento } from './Consentimiento.ts'
import { calcularEdad, esMenorDeEdad, MAYORIA_DE_EDAD } from './edad.ts'

export type EstadoUsoImagen = 'AUTORIZADA' | 'NO_AUTORIZADA' | 'REQUIERE_TUTOR'

// Lo que autorizó el tutor de un menor deja de valer cuando cumple 18: desde ahí autoriza él.
function laDioSiendoMayor(fechaNacimiento: string, autorizacion: Consentimiento): boolean {
  const diaEnQueLaDio = fechaDeHoy(new Date(autorizacion.registradoEn))
  const edad = calcularEdad(fechaNacimiento, diaEnQueLaDio)
  return edad !== null && edad >= MAYORIA_DE_EDAD
}

/** Sin autorización vigente no hay fotos (RNF-11). A un menor la autoriza su tutor (RF-21). */
export function estadoUsoImagen(
  beneficiario: Pick<Beneficiario, 'consentimientoImagen' | 'fechaNacimiento'>,
  hoy: string,
): EstadoUsoImagen {
  const { fechaNacimiento, consentimientoImagen } = beneficiario
  if (esMenorDeEdad(fechaNacimiento, hoy)) return 'REQUIERE_TUTOR'
  if (consentimientoImagen && laDioSiendoMayor(fechaNacimiento, consentimientoImagen)) {
    return 'AUTORIZADA'
  }
  return 'NO_AUTORIZADA'
}
