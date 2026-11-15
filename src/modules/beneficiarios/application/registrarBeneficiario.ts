import type { Beneficiario } from '@/modules/beneficiarios/domain/Beneficiario.ts'
import {
  limpiarNuevoBeneficiario,
  type NuevoBeneficiario,
} from '@/modules/beneficiarios/domain/NuevoBeneficiario.ts'
import type { BeneficiarioRepository } from './ports/BeneficiarioRepository.ts'

interface Dependencias {
  readonly repositorio: BeneficiarioRepository
}

export type RegistrarBeneficiario = (datos: NuevoBeneficiario) => Promise<Beneficiario>

export function crearRegistrarBeneficiario({ repositorio }: Dependencias): RegistrarBeneficiario {
  // No consulta antes si la persona existe: quien decide es el servidor, que rechaza el duplicado.
  return (datos) => repositorio.registrar(limpiarNuevoBeneficiario(datos))
}
