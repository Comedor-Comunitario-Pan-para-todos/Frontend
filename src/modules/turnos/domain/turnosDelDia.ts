import type { Turno } from './Turno.ts'

const CIFRAS_MINIMAS = 3

/** El número como se dice en la reja: «#043». Con tres cifras para que se lea igual de lejos. */
export function formatearNumeroTurno(numero: number): string {
  return `#${String(numero).padStart(CIFRAS_MINIMAS, '0')}`
}

/** El último turno entregado va primero: es el que la persona en la reja acaba de dar. */
export function recientesPrimero(turnos: readonly Turno[]): Turno[] {
  return [...turnos].sort((a, b) => b.numero - a.numero)
}

/** El turno que la persona ya recibió hoy, si lo tiene (HU-27: solo uno por día). */
export function turnoDeLaPersona(turnos: readonly Turno[], idBeneficiario: string): Turno | null {
  return turnos.find((turno) => turno.beneficiario.id === idBeneficiario) ?? null
}
