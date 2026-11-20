import { FINALIDAD_USO_IMAGEN } from '@/modules/beneficiarios/domain/politicaImagen.ts'
import type { RegistroConsentimiento } from '@/modules/beneficiarios/domain/RegistroConsentimiento.ts'
import type { ConsentimientoRepository } from './ports/ConsentimientoRepository.ts'

interface Dependencias {
  readonly repositorio: ConsentimientoRepository
}

export type RetirarUsoDeImagen = (idBeneficiario: string) => Promise<RegistroConsentimiento>

export function crearRetirarUsoDeImagen({ repositorio }: Dependencias): RetirarUsoDeImagen {
  return (idBeneficiario) => repositorio.revocar(idBeneficiario, FINALIDAD_USO_IMAGEN)
}
