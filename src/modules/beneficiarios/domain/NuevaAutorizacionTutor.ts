import { normalizarNumeroDocumento } from './documento.ts'
import type { TipoDocumentoTutor } from './documentoTutor.ts'
import type { Parentesco } from './parentesco.ts'
import { normalizarTelefono } from './telefono.ts'
import { quitarEspaciosSobrantes } from './texto.ts'

export interface NuevaAutorizacionTutor {
  readonly nombre: string
  readonly tipoDocumento: TipoDocumentoTutor
  readonly numeroDocumento: string
  readonly parentesco: Parentesco
  readonly telefono: string
  readonly soporte: File
}

export function limpiarNuevaAutorizacionTutor(
  datos: NuevaAutorizacionTutor,
): NuevaAutorizacionTutor {
  return {
    ...datos,
    nombre: quitarEspaciosSobrantes(datos.nombre),
    numeroDocumento: normalizarNumeroDocumento(datos.numeroDocumento),
    telefono: normalizarTelefono(datos.telefono),
  }
}
