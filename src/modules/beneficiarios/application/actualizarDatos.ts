import type { Beneficiario } from '@/modules/beneficiarios/domain/Beneficiario.ts'
import {
  limpiarActualizacion,
  type ActualizacionDeDatos,
} from '@/modules/beneficiarios/domain/ActualizacionDeDatos.ts'
import type { BeneficiarioRepository } from './ports/BeneficiarioRepository.ts'

interface Dependencias {
  readonly repositorio: BeneficiarioRepository
}

export type ActualizarDatos = (
  id: string,
  actualizacion: ActualizacionDeDatos,
) => Promise<Beneficiario>

export function crearActualizarDatos({ repositorio }: Dependencias): ActualizarDatos {
  return (id, actualizacion) => repositorio.actualizarDatos(id, limpiarActualizacion(actualizacion))
}
