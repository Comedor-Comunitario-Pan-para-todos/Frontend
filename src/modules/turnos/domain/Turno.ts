/** Al entregarse, todo turno queda «En espera» hasta que la persona pasa a recibir su ración. */
export type EstadoTurno = 'EN_ESPERA'

/** Persona del padrón a la que se le entregó el turno: solo lo que se muestra en la fila. */
export interface PersonaDelTurno {
  readonly id: string
  readonly nombreCompleto: string
}

/** Turno de la fila de atención (RF-03): un número consecutivo que vuelve a empezar en 1 cada día. */
export interface Turno {
  readonly id: string
  readonly numero: number
  readonly beneficiario: PersonaDelTurno
  /** Momento de la entrega, en ISO 8601. */
  readonly entregadoEn: string
  readonly estado: EstadoTurno
}
