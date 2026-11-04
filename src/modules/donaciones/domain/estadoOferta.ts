import type { EstadoOferta } from './ofertaDonacion.ts'

/**
 * Recorrido de una oferta:
 *   PENDIENTE -> ACEPTADA -> RECIBIDA
 *   PENDIENTE -> RECHAZADA (no genera donación)
 */

export function puedeDecidirseOferta(estado: EstadoOferta): boolean {
  return estado === 'PENDIENTE'
}

export function puedeRecibirseOferta(estado: EstadoOferta): boolean {
  return estado === 'ACEPTADA'
}
