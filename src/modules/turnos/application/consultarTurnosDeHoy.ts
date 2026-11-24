import type { Turno } from '@/modules/turnos/domain/Turno.ts'
import { recientesPrimero } from '@/modules/turnos/domain/turnosDelDia.ts'
import type { TurnosRepository } from './ports/TurnosRepository.ts'

interface Dependencias {
  readonly repositorio: TurnosRepository
}

export type ConsultarTurnosDeHoy = () => Promise<Turno[]>

/** Trae los turnos de hoy con el último entregado de primero. */
export function crearConsultarTurnosDeHoy({ repositorio }: Dependencias): ConsultarTurnosDeHoy {
  return async () => recientesPrimero(await repositorio.consultarDeHoy())
}
