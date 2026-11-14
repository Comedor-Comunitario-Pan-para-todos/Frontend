/**
 * Cuántos datos se piden según el propósito de la atención (RF-02). El básico basta para
 * recibir la ración; el extendido agrega datos sensibles solo cuando el trámite los necesita.
 */
export const NIVELES_CAPTURA = ['BASICO', 'EXTENDIDO'] as const

export type NivelCaptura = (typeof NIVELES_CAPTURA)[number]
