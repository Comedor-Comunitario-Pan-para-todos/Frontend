import type { ConsentimientoRepository } from '@/modules/beneficiarios/application/ports/ConsentimientoRepository.ts'
import type { Consentimiento } from '@/modules/beneficiarios/domain/Consentimiento.ts'
import type { PoliticaDeDatos } from '@/modules/beneficiarios/domain/politicaVigente.ts'
import type { HttpClient } from '@/shared/infrastructure/http/HttpClient.ts'
import { aCuerpoDeConsentimiento } from './peticionesConsentimiento.ts'
import { esquemaConsentimiento } from './respuestasConsentimiento.ts'

function rutaDeConsentimiento(idBeneficiario: string): string {
  return `/beneficiarios/${encodeURIComponent(idBeneficiario)}/consentimiento`
}

export class ConsentimientoHttpRepository implements ConsentimientoRepository {
  readonly #http: HttpClient

  constructor(http: HttpClient) {
    this.#http = http
  }

  registrar(idBeneficiario: string, politica: PoliticaDeDatos): Promise<Consentimiento> {
    return this.#http.post(
      rutaDeConsentimiento(idBeneficiario),
      aCuerpoDeConsentimiento(politica),
      { esquema: esquemaConsentimiento },
    )
  }
}
