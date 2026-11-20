/**
 * Rango de fechas de calendario `AAAA-MM-DD`, con los dos extremos incluidos. Se trabaja con
 * el texto, sin `Date`: una fecha de calendario no tiene hora ni zona horaria que la corran.
 */
export interface RangoFechas {
  readonly desde: string
  readonly hasta: string
}

export type ErrorFechaDesde = 'vacia' | 'invalida' | 'futura' | 'posterior-a-hasta'
export type ErrorFechaHasta = 'vacia' | 'invalida' | 'futura'

export interface ErroresDeRango {
  readonly desde?: ErrorFechaDesde
  readonly hasta?: ErrorFechaHasta
}

const FECHA_CALENDARIO = /^(\d{4})-(\d{2})-(\d{2})$/

/** Dice si el texto es una fecha `AAAA-MM-DD` que existe (descarta, por ejemplo, el 31 de abril). */
export function esFechaCalendario(texto: string): boolean {
  const partes = FECHA_CALENDARIO.exec(texto)
  if (!partes) return false

  const [anio, mes, dia] = partes.slice(1).map(Number) as [number, number, number]
  const fecha = new Date(Date.UTC(anio, mes - 1, dia))
  return (
    fecha.getUTCFullYear() === anio && fecha.getUTCMonth() === mes - 1 && fecha.getUTCDate() === dia
  )
}

function errorDeFecha(fecha: string, hoy: string): 'vacia' | 'invalida' | 'futura' | undefined {
  if (fecha === '') return 'vacia'
  if (!esFechaCalendario(fecha)) return 'invalida'
  // Con el formato AAAA-MM-DD, comparar el texto es comparar las fechas.
  if (fecha > hoy) return 'futura'
  return undefined
}

/** Qué está mal en cada extremo del rango. `hoy` es la fecha de hoy en `AAAA-MM-DD`. */
export function erroresDeRango({ desde, hasta }: RangoFechas, hoy: string): ErroresDeRango {
  const errorDesde = errorDeFecha(desde, hoy)
  const errorHasta = errorDeFecha(hasta, hoy)
  const desdeDespuesDeHasta = !errorDesde && !errorHasta && desde > hasta

  return {
    ...(errorDesde && { desde: errorDesde }),
    ...(desdeDespuesDeHasta && { desde: 'posterior-a-hasta' as const }),
    ...(errorHasta && { hasta: errorHasta }),
  }
}

export function esRangoValido(rango: RangoFechas, hoy: string): boolean {
  const errores = erroresDeRango(rango, hoy)
  return errores.desde === undefined && errores.hasta === undefined
}
