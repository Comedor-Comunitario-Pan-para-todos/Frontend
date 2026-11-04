import { esFechaValida, validarInsumo } from './insumoDonado.ts'
import type { InsumoDonado } from './insumoDonado.ts'

/**
 * Oferta de donación (RF-11). El donante la envía desde su portal y la
 * Coordinadora decide si la acepta según el espacio en bodega. Los nombres de
 * los campos son provisionales hasta acordar el contrato con backend
 * (Backend#48).
 */

export type EstadoOferta = 'PENDIENTE' | 'ACEPTADA' | 'RECHAZADA' | 'RECIBIDA'

export type UnidadEmpaque = 'UNIDAD' | 'BOLSA' | 'CAJA' | 'BULTO'

export type ModalidadTransporte = 'VEHICULO_PROPIO' | 'RECOGIDA_CCPT'

export interface InsumoOfertado extends InsumoDonado {
  cantidad: number
  unidadEmpaque: UnidadEmpaque
}

export interface LogisticaEntrega {
  fechaEntrega: string
  horaLlegada: string | null
  transporte: ModalidadTransporte | null
}

export interface DatosDonante {
  nombre: string
  nit: string | null
  contacto: string | null
}

/** Lo que llena el donante. Quién dona sale de su sesión, no del formulario. */
export interface DatosNuevaOferta {
  insumos: InsumoOfertado[]
  logistica: LogisticaEntrega
  observaciones: string
}

export interface OfertaDonacion extends DatosNuevaOferta {
  id: number
  radicado: string
  donante: DatosDonante
  estado: EstadoOferta
  fechaOferta: string
}

export function validarOferta(datos: DatosNuevaOferta, fechaHoy: string): string | null {
  if (datos.insumos.length === 0) {
    return 'Agrega al menos un insumo a la oferta.'
  }

  const { fechaEntrega, transporte } = datos.logistica

  if (!esFechaValida(fechaEntrega)) {
    return 'Elige la fecha de entrega.'
  }

  if (fechaEntrega < fechaHoy) {
    return 'La fecha de entrega no puede ser anterior a hoy.'
  }

  if (transporte === null) {
    return 'Elige cómo llegará la donación al comedor.'
  }

  for (const insumo of datos.insumos) {
    const error = validarInsumo(insumo, fechaEntrega)
    if (error !== null) {
      return error
    }

    if (!Number.isInteger(insumo.cantidad) || insumo.cantidad <= 0) {
      return 'La cantidad de cada insumo debe ser un número entero mayor a 0.'
    }
  }

  return null
}
