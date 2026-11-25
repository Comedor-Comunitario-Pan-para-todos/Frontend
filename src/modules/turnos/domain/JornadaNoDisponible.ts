/**
 * El servidor no entregó el turno porque la jornada de hoy no está abierta o ya se entregaron
 * todas las raciones. No se arregla reintentando: hay que avisarle a la coordinadora.
 */
export class JornadaNoDisponible extends Error {
  constructor(causa?: unknown) {
    super('La jornada de hoy no está disponible para entregar turnos', { cause: causa })
    this.name = 'JornadaNoDisponible'
  }
}

export function esJornadaNoDisponible(error: unknown): error is JornadaNoDisponible {
  return error instanceof JornadaNoDisponible
}
