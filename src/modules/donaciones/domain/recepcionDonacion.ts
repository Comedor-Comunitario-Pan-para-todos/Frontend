import { validarInsumo } from './insumoDonado.ts'
import type { InsumoDonado } from './insumoDonado.ts'
import type { DatosDonante } from './ofertaDonacion.ts'

/**
 * Recepción física de una donación en bodega . Puede venir de una
 * oferta aceptada o ser espontánea (aportes vecinales sin cita previa).
 *
 * El comedor no tiene una báscula confiable, así que la recepción debe decir
 * si los pesos fueron medidos o estimados: no se guarda sin esa marca.
 */

export type TipoPeso = 'MEDIDO' | 'ESTIMADO'

export interface DatosRecepcion {
  /** `null` cuando la donación llega sin oferta previa (espontánea). */
  ofertaId: number | null
  donante: DatosDonante
  insumos: InsumoDonado[]
  tipoPeso: TipoPeso | null
}

export function validarRecepcion(datos: DatosRecepcion, fechaHoy: string): string | null {
  if (datos.donante.nombre.trim() === '') {
    return 'Escribe el nombre del donante.'
  }

  if (datos.insumos.length === 0) {
    return 'Agrega al menos un insumo recibido.'
  }

  for (const insumo of datos.insumos) {
    const error = validarInsumo(insumo, fechaHoy)
    if (error !== null) {
      return error
    }
  }

  if (datos.tipoPeso === null) {
    return 'Indica si el peso fue medido con báscula o estimado.'
  }

  return null
}
