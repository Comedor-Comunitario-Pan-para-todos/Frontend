import type { Consentimiento } from '@/modules/beneficiarios/domain/Consentimiento.ts'
import type { PoliticaDeDatos } from '@/modules/beneficiarios/domain/politicaVigente.ts'
import type { RegistroConsentimiento } from '@/modules/beneficiarios/domain/RegistroConsentimiento.ts'

export interface ConsentimientoRepository {
  registrar(idBeneficiario: string, politica: PoliticaDeDatos): Promise<Consentimiento>
  revocar(idBeneficiario: string, finalidad: string): Promise<RegistroConsentimiento>
  consultarHistorial(idBeneficiario: string, finalidad: string): Promise<RegistroConsentimiento[]>
}
