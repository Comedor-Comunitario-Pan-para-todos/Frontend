import type { Beneficiario } from '@/modules/beneficiarios/domain/Beneficiario.ts'
import {
  limpiarDatosExtendidos,
  type DatosExtendidos,
} from '@/modules/beneficiarios/domain/NuevoBeneficiario.ts'
import type { BeneficiarioRepository } from './ports/BeneficiarioRepository.ts'

interface Dependencias {
  readonly repositorio: BeneficiarioRepository
}

export type CompletarDatosExtendidos = (id: string, datos: DatosExtendidos) => Promise<Beneficiario>

export function crearCompletarDatosExtendidos({
  repositorio,
}: Dependencias): CompletarDatosExtendidos {
  return (id, datos) => repositorio.completarDatosExtendidos(id, limpiarDatosExtendidos(datos))
}
