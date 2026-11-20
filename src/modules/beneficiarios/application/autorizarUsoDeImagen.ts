import type { Consentimiento } from '@/modules/beneficiarios/domain/Consentimiento.ts'
import { POLITICA_IMAGEN } from '@/modules/beneficiarios/domain/politicaImagen.ts'
import type { ConsentimientoRepository } from './ports/ConsentimientoRepository.ts'

interface Dependencias {
  readonly repositorio: ConsentimientoRepository
}

export type AutorizarUsoDeImagen = (idBeneficiario: string) => Promise<Consentimiento>

export function crearAutorizarUsoDeImagen({ repositorio }: Dependencias): AutorizarUsoDeImagen {
  const { version, finalidad } = POLITICA_IMAGEN
  return (idBeneficiario) => repositorio.registrar(idBeneficiario, { version, finalidad })
}
