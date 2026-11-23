import type { AutorizacionTutor } from '@/modules/beneficiarios/domain/AutorizacionTutor.ts'
import {
  limpiarNuevaAutorizacionTutor,
  type NuevaAutorizacionTutor,
} from '@/modules/beneficiarios/domain/NuevaAutorizacionTutor.ts'
import type { AutorizacionTutorRepository } from './ports/AutorizacionTutorRepository.ts'

interface Dependencias {
  readonly repositorio: AutorizacionTutorRepository
}

export type RegistrarAutorizacionTutor = (
  idBeneficiario: string,
  datos: NuevaAutorizacionTutor,
) => Promise<AutorizacionTutor>

/** Aprueba al tutor de un menor con el papel que firmó. No autoriza aún el uso de su imagen. */
export function crearRegistrarAutorizacionTutor({
  repositorio,
}: Dependencias): RegistrarAutorizacionTutor {
  return (idBeneficiario, datos) =>
    repositorio.registrar(idBeneficiario, limpiarNuevaAutorizacionTutor(datos))
}
