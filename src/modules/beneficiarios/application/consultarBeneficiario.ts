import type { Beneficiario } from '@/modules/beneficiarios/domain/Beneficiario.ts'
import type { BeneficiarioRepository } from './ports/BeneficiarioRepository.ts'

interface Dependencias {
  readonly repositorio: BeneficiarioRepository
}

export type ConsultarBeneficiario = (id: string, signal?: AbortSignal) => Promise<Beneficiario>

export function crearConsultarBeneficiario({ repositorio }: Dependencias): ConsultarBeneficiario {
  return (id, signal) => repositorio.consultarPorId(id, signal)
}
