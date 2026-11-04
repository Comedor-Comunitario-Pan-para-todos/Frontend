import type { BeneficiarioRepository } from '@/modules/beneficiarios/application/ports/BeneficiarioRepository.ts'
import type { AutorizacionTutor, DatosTutor } from '@/modules/beneficiarios/domain/autorizacionTutor.ts'
import type { DatosPermisoFoto } from '@/modules/beneficiarios/domain/permisoFoto.ts'
import { obtenerFechaHoy } from '@/shared/infrastructure/fechaHoy.ts'

export interface BeneficiarioEnMemoria {
  id: number
  aceptaUsoImagen: boolean
  fechaNacimiento: string | null
  autorizacionTutor: AutorizacionTutor | null
}

export class BeneficiarioEnMemoriaRepository implements BeneficiarioRepository {
  private beneficiarios: BeneficiarioEnMemoria[]
  fotosSubidas: string[] = []

  constructor(beneficiarios: BeneficiarioEnMemoria[]) {
    this.beneficiarios = beneficiarios
  }

  async obtenerDatosPermisoFoto(beneficiarioId: number): Promise<DatosPermisoFoto> {
    const beneficiario = this.buscar(beneficiarioId)
    return {
      aceptaUsoImagen: beneficiario.aceptaUsoImagen,
      fechaNacimiento: beneficiario.fechaNacimiento,
      tieneAutorizacionTutor: beneficiario.autorizacionTutor !== null,
    }
  }

  async obtenerAutorizacionTutor(beneficiarioId: number): Promise<AutorizacionTutor | null> {
    return this.buscar(beneficiarioId).autorizacionTutor
  }

  async registrarAutorizacionTutor(beneficiarioId: number, tutor: DatosTutor): Promise<void> {
    const beneficiario = this.buscar(beneficiarioId)
    beneficiario.autorizacionTutor = { tutor, fechaAprobacion: obtenerFechaHoy() }
  }

  async subirFoto(beneficiarioId: number, foto: File): Promise<void> {
    this.buscar(beneficiarioId)
    this.fotosSubidas.push(foto.name)
  }

  private buscar(beneficiarioId: number): BeneficiarioEnMemoria {
    const beneficiario = this.beneficiarios.find((item) => item.id === beneficiarioId)
    if (beneficiario === undefined) {
      throw new Error('Beneficiario no encontrado.')
    }
    return beneficiario
  }
}
