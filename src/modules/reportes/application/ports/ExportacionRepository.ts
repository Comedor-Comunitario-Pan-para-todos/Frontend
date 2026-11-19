import type { RangoFechas } from '@/modules/reportes/domain/RangoFechas.ts'
import type { ResumenExportacion } from '@/modules/reportes/domain/ResumenExportacion.ts'

/** Archivo que generó el servidor, listo para guardarlo en el teléfono. */
export interface ArchivoGenerado {
  readonly nombre: string
  readonly contenido: Blob
}

export interface OpcionesGeneracion {
  readonly signal?: AbortSignal
  /**
   * Avance de la descarga entre 0 y 1. `null` si el servidor no dice cuánto pesa el archivo:
   * la interfaz muestra entonces una barra sin porcentaje.
   */
  readonly alAvanzar?: (avance: number | null) => void
}

export interface ExportacionRepository {
  /** Cuántas personas entrarían en el padrón del rango, sin generar el archivo. */
  consultarResumen(rango: RangoFechas, signal?: AbortSignal): Promise<ResumenExportacion>
  /** Genera el `.xlsx` del padrón para la Alcaldía. El servidor deja la descarga auditada. */
  generarPadron(rango: RangoFechas, opciones?: OpcionesGeneracion): Promise<ArchivoGenerado>
}
