import type { BeneficiarioRepository } from './ports/BeneficiarioRepository.ts'

interface Dependencias {
  readonly repositorio: BeneficiarioRepository
}

export type ConsultarBarrios = (signal?: AbortSignal) => Promise<readonly string[]>

export function crearConsultarBarrios({ repositorio }: Dependencias): ConsultarBarrios {
  return (signal) => repositorio.listarBarrios(signal)
}
