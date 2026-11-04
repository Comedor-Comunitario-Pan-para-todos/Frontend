/**
 * Insumo que entra al comedor por una donación. Lo comparten la oferta del
 * donante y la recepción en bodega (RF-11). Los nombres de los campos son
 * provisionales hasta acordar el contrato con backend 
 */

export type UnidadMedida = 'KG' | 'L'

export interface InsumoDonado {
  nombre: string
  categoria: string
  presentacion: string | null
  peso: number
  unidadMedida: UnidadMedida
  fechaVencimiento: string
}

export interface PesoTotal {
  kg: number
  litros: number
}

const FORMATO_FECHA = /^\d{4}-\d{2}-\d{2}$/

export function validarInsumo(insumo: InsumoDonado, fechaLlegada: string): string | null {
  if (insumo.nombre.trim() === '') {
    return 'Escribe el nombre de cada insumo.'
  }

  if (insumo.categoria.trim() === '') {
    return 'Elige la categoría de cada insumo.'
  }

  if (!Number.isFinite(insumo.peso) || insumo.peso <= 0) {
    return 'El peso de cada insumo debe ser mayor a 0.'
  }

  if (!esFechaValida(insumo.fechaVencimiento)) {
    return 'Indica la fecha de vencimiento de cada insumo.'
  }

  if (insumo.fechaVencimiento <= fechaLlegada) {
    return `El insumo "${insumo.nombre.trim()}" estaría vencido al llegar al comedor.`
  }

  return null
}

export function sumarPesos(insumos: Pick<InsumoDonado, 'peso' | 'unidadMedida'>[]): PesoTotal {
  const total: PesoTotal = { kg: 0, litros: 0 }

  for (const insumo of insumos) {
    if (insumo.unidadMedida === 'KG') {
      total.kg = total.kg + insumo.peso
    } else {
      total.litros = total.litros + insumo.peso
    }
  }

  return total
}

export function esFechaValida(fecha: string): boolean {
  return FORMATO_FECHA.test(fecha)
}
