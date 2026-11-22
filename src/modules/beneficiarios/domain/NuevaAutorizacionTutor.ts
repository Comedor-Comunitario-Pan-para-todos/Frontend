import type { TipoDocumentoTutor } from './documentoTutor.ts'
import type { Parentesco } from './parentesco.ts'

export interface NuevaAutorizacionTutor {
  readonly nombre: string
  readonly tipoDocumento: TipoDocumentoTutor
  readonly numeroDocumento: string
  readonly parentesco: Parentesco
  readonly telefono: string
  readonly soporte: File
}
