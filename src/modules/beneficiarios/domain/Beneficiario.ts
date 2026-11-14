import type { ClasificacionSocioeconomica } from './clasificacionSocioeconomica.ts'
import type { Documento } from './documento.ts'
import type { NivelCaptura } from './nivelCaptura.ts'
import { quitarEspaciosSobrantes } from './texto.ts'

export interface Beneficiario {
  readonly id: string
  readonly nivel: NivelCaptura
  readonly nombres: string
  readonly apellidos: string
  /** `null` cuando la persona no tiene documento: no es motivo para negarle la atención. */
  readonly documento: Documento | null
  /** Fecha de calendario `AAAA-MM-DD`, sin hora ni zona horaria. */
  readonly fechaNacimiento: string
  readonly barrio: string | null
  readonly telefono: string | null
  readonly clasificacion: ClasificacionSocioeconomica | null
  /** Momento del registro, en formato ISO 8601. */
  readonly registradoEn: string
}

type Nombre = Pick<Beneficiario, 'nombres' | 'apellidos'>

export function nombreCompleto({ nombres, apellidos }: Nombre): string {
  return quitarEspaciosSobrantes(`${nombres} ${apellidos}`)
}

/** Primera letra del nombre y del apellido, para el distintivo de la tarjeta ("MR"). */
export function iniciales({ nombres, apellidos }: Nombre): string {
  return [nombres, apellidos].map((parte) => parte.trim().charAt(0).toUpperCase()).join('')
}
