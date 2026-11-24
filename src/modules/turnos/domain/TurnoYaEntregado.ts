import type { Turno } from './Turno.ts'

/** El servidor no entregó otro turno porque la persona ya recibió uno hoy (HU-27). */
export class TurnoYaEntregado extends Error {
  /** El turno que ya tenía, para mostrárselo otra vez si lo perdió. */
  readonly turno: Turno

  constructor(turno: Turno, causa?: unknown) {
    super('La persona ya recibió un turno hoy', { cause: causa })
    this.name = 'TurnoYaEntregado'
    this.turno = turno
  }
}

export function esTurnoYaEntregado(error: unknown): error is TurnoYaEntregado {
  return error instanceof TurnoYaEntregado
}
