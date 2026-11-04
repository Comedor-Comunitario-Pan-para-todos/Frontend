import { validarArchivoAutorizacion } from '@/modules/beneficiarios/domain/archivoAutorizacion.ts'
import type { DatosTutor } from '@/modules/beneficiarios/domain/autorizacionTutor.ts'
import type { BeneficiarioRepository } from './ports/BeneficiarioRepository.ts'

export async function registrarAutorizacionTutor(
  repositorio: BeneficiarioRepository,
  beneficiarioId: number,
  tutor: DatosTutor,
  archivo: File,
): Promise<void> {
  const error = validarArchivoAutorizacion(archivo.type, archivo.size)
  if (error !== null) {
    throw new Error(error)
  }

  await repositorio.registrarAutorizacionTutor(beneficiarioId, tutor, archivo)
}
