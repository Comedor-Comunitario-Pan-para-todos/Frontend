import type { AutorizacionTutor, DatosTutor } from '@/modules/beneficiarios/domain/autorizacionTutor.ts'
import type { DatosPermisoFoto } from '@/modules/beneficiarios/domain/permisoFoto.ts'

export interface BeneficiarioRepository {
  obtenerDatosPermisoFoto(beneficiarioId: number): Promise<DatosPermisoFoto>
  obtenerAutorizacionTutor(beneficiarioId: number): Promise<AutorizacionTutor | null>
  registrarAutorizacionTutor(beneficiarioId: number, tutor: DatosTutor, archivo: File): Promise<void>
  subirFoto(beneficiarioId: number, foto: File): Promise<void>
}
