import type { RangoFechas } from './RangoFechas.ts'

/**
 * Cuántas personas quedan en el padrón para la Alcaldía en un rango de fechas. Solo entran
 * quienes asistieron en el rango y autorizaron ese reporte (Ley 1581 de 2012).
 */
export interface ResumenExportacion {
  /** Personas distintas que asistieron al menos una vez en el rango. */
  readonly asistieron: number
  /** Las que autorizaron el reporte: son las filas del archivo. */
  readonly incluidas: number
  /** Las que no autorizaron el reporte: no salen en el archivo. */
  readonly excluidas: number
}

/** Un archivo sin filas no le sirve a la Alcaldía: solo se genera si alguien queda incluido. */
export function hayPersonasParaExportar(resumen: ResumenExportacion): boolean {
  return resumen.incluidas > 0
}

/** Nombre del archivo cuando el servidor no manda uno. */
export function nombreDelPadron({ desde, hasta }: RangoFechas): string {
  return `padron-beneficiarios_${desde}_a_${hasta}.xlsx`
}
