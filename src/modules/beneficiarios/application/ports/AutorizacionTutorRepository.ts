import type { AutorizacionTutor } from '@/modules/beneficiarios/domain/AutorizacionTutor.ts'
import type { NuevaAutorizacionTutor } from '@/modules/beneficiarios/domain/NuevaAutorizacionTutor.ts'

export interface AutorizacionTutorRepository {
  registrar(idBeneficiario: string, datos: NuevaAutorizacionTutor): Promise<AutorizacionTutor>
  revocar(idBeneficiario: string, motivo: string): Promise<AutorizacionTutor>
}
