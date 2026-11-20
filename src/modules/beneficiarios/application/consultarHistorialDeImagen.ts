import { FINALIDAD_USO_IMAGEN } from '@/modules/beneficiarios/domain/politicaImagen.ts'
import type { RegistroConsentimiento } from '@/modules/beneficiarios/domain/RegistroConsentimiento.ts'
import type { ConsentimientoRepository } from './ports/ConsentimientoRepository.ts'

interface Dependencias {
  readonly repositorio: ConsentimientoRepository
}

export type ConsultarHistorialDeImagen = (
  idBeneficiario: string,
) => Promise<RegistroConsentimiento[]>

export function crearConsultarHistorialDeImagen({
  repositorio,
}: Dependencias): ConsultarHistorialDeImagen {
  return (idBeneficiario) => repositorio.consultarHistorial(idBeneficiario, FINALIDAD_USO_IMAGEN)
}
