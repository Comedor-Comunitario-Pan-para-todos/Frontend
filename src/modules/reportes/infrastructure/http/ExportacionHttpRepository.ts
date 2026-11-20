import type {
  ArchivoGenerado,
  ExportacionRepository,
  OpcionesGeneracion,
} from '@/modules/reportes/application/ports/ExportacionRepository.ts'
import type { RangoFechas } from '@/modules/reportes/domain/RangoFechas.ts'
import {
  nombreDelPadron,
  type ResumenExportacion,
} from '@/modules/reportes/domain/ResumenExportacion.ts'
import type { HttpClient } from '@/shared/infrastructure/http/HttpClient.ts'
import { esquemaResumenExportacion } from './respuestasExportacion.ts'

const RUTA_RESUMEN = '/exportaciones/beneficiarios/resumen'
const RUTA_PADRON = '/exportaciones/beneficiarios.xlsx'

export class ExportacionHttpRepository implements ExportacionRepository {
  readonly #http: HttpClient

  constructor(http: HttpClient) {
    this.#http = http
  }

  consultarResumen(
    { desde, hasta }: RangoFechas,
    signal?: AbortSignal,
  ): Promise<ResumenExportacion> {
    return this.#http.get(RUTA_RESUMEN, {
      esquema: esquemaResumenExportacion,
      params: { desde, hasta },
      signal,
    })
  }

  async generarPadron(
    rango: RangoFechas,
    opciones: OpcionesGeneracion = {},
  ): Promise<ArchivoGenerado> {
    const { contenido, nombreArchivo } = await this.#http.descargar(RUTA_PADRON, {
      // El caso de uso solo llega aquí si el Presidente de la JAC aceptó la responsabilidad (RNF-08):
      // se envía para que quede en la auditoría de la descarga.
      params: { desde: rango.desde, hasta: rango.hasta, responsabilidadAceptada: true },
      signal: opciones.signal,
      alAvanzar: opciones.alAvanzar,
    })

    return { nombre: nombreArchivo ?? nombreDelPadron(rango), contenido }
  }
}
