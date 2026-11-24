import type { AutorizacionTutor } from '@/modules/beneficiarios/domain/AutorizacionTutor.ts'
import { quitarEspaciosSobrantes } from '@/modules/beneficiarios/domain/texto.ts'
import type { AutorizacionTutorRepository } from './ports/AutorizacionTutorRepository.ts'

interface Dependencias {
  readonly repositorio: AutorizacionTutorRepository
}

export type RevocarAutorizacionTutor = (
  idBeneficiario: string,
  motivo: string,
) => Promise<AutorizacionTutor>

/** El servidor también retira la autorización de imagen vigente del menor. */
export function crearRevocarAutorizacionTutor({
  repositorio,
}: Dependencias): RevocarAutorizacionTutor {
  return (idBeneficiario, motivo) =>
    repositorio.revocar(idBeneficiario, quitarEspaciosSobrantes(motivo))
}
