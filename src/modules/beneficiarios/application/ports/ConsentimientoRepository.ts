import type { Consentimiento } from '@/modules/beneficiarios/domain/Consentimiento.ts'
import type { PoliticaDeDatos } from '@/modules/beneficiarios/domain/politicaVigente.ts'

export interface ConsentimientoRepository {
  /** Si la persona ya había aceptado esa versión, devuelve el consentimiento que tenía. */
  registrar(idBeneficiario: string, politica: PoliticaDeDatos): Promise<Consentimiento>
}
