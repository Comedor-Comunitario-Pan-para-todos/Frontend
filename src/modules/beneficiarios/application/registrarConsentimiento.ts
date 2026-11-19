import type { Consentimiento } from '@/modules/beneficiarios/domain/Consentimiento.ts'
import { POLITICA_VIGENTE } from '@/modules/beneficiarios/domain/politicaVigente.ts'
import type { ConsentimientoRepository } from './ports/ConsentimientoRepository.ts'

interface Dependencias {
  readonly repositorio: ConsentimientoRepository
}

export type RegistrarConsentimiento = (idBeneficiario: string) => Promise<Consentimiento>

/** Guarda que la persona aceptó la política vigente. */
export function crearRegistrarConsentimiento({
  repositorio,
}: Dependencias): RegistrarConsentimiento {
  const { version, finalidad } = POLITICA_VIGENTE
  return (idBeneficiario) => repositorio.registrar(idBeneficiario, { version, finalidad })
}
