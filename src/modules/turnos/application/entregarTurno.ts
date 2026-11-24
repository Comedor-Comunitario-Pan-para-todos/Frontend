import type { Turno } from '@/modules/turnos/domain/Turno.ts'
import type { TurnosRepository } from './ports/TurnosRepository.ts'

interface Dependencias {
  readonly repositorio: TurnosRepository
}

export type EntregarTurno = (idBeneficiario: string) => Promise<Turno>

/**
 * Entrega el turno del día a la persona. El servidor decide el número y si ya tenía uno:
 * es el único que ve a la vez a todos los voluntarios de la reja.
 */
export function crearEntregarTurno({ repositorio }: Dependencias): EntregarTurno {
  return (idBeneficiario) => repositorio.entregar(idBeneficiario)
}
