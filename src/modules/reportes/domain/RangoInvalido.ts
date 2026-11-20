import type { ErroresDeRango, RangoFechas } from './RangoFechas.ts'

/** Se pidió un reporte con un rango de fechas que no se puede usar. */
export class RangoInvalido extends Error {
  readonly rango: RangoFechas
  readonly errores: ErroresDeRango

  constructor(rango: RangoFechas, errores: ErroresDeRango) {
    super(`Rango de fechas inválido: ${rango.desde} a ${rango.hasta}`)
    this.name = 'RangoInvalido'
    this.rango = rango
    this.errores = errores
  }
}
