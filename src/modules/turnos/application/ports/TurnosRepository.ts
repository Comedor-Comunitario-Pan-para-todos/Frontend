import type { Turno } from '@/modules/turnos/domain/Turno.ts'

export interface TurnosRepository {
  /** Los turnos entregados en la jornada de hoy, en el orden en que los mande el servidor. */
  consultarDeHoy(): Promise<Turno[]>
  /**
   * Entrega el siguiente turno del día a una persona del padrón.
   * Lanza `TurnoYaEntregado` si ya recibió uno hoy y `JornadaNoDisponible` si no se puede
   * entregar ninguno ahora.
   */
  entregar(idBeneficiario: string): Promise<Turno>
}
