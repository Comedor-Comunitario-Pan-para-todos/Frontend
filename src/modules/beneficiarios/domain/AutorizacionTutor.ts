import type { TipoDocumentoTutor } from './documento.ts'
import type { Parentesco } from './parentesco.ts'

/** Los datos tal como quedaron en el papel firmado. */
export interface DatosTutor {
  readonly nombre: string
  readonly parentesco: Parentesco
  /** `null` para quien no es Coordinadora (RNF-07). */
  readonly tipoDocumento: TipoDocumentoTutor | null
  readonly numeroDocumento: string | null
  readonly telefono: string | null
}

/** Autorización firmada del tutor de un menor para el uso de su imagen (RF-21). */
export interface AutorizacionTutor {
  readonly id: string
  readonly estado: 'ACTIVA' | 'REVOCADA'
  readonly tutor: DatosTutor
  readonly aprobadaPor: string
  readonly fechaAprobacion: string
  readonly revocadaEn: string | null
  readonly revocadaPor: string | null
  readonly motivoRevocacion: string | null
}
