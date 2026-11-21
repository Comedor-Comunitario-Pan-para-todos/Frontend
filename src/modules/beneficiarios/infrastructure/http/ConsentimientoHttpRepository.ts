import type { ConsentimientoRepository } from '@/modules/beneficiarios/application/ports/ConsentimientoRepository.ts'
import type { Consentimiento } from '@/modules/beneficiarios/domain/Consentimiento.ts'
import type { PoliticaDeDatos } from '@/modules/beneficiarios/domain/politicaVigente.ts'
import type { RegistroConsentimiento } from '@/modules/beneficiarios/domain/RegistroConsentimiento.ts'
import type { HttpClient } from '@/shared/infrastructure/http/HttpClient.ts'
import { aCuerpoDeConsentimiento } from './peticionesConsentimiento.ts'
import {
  esquemaConsentimiento,
  esquemaHistorialConsentimiento,
  esquemaRegistroConsentimiento,
} from './respuestasConsentimiento.ts'

function rutaDelBeneficiario(idBeneficiario: string): string {
  return `/beneficiarios/${encodeURIComponent(idBeneficiario)}`
}

export class ConsentimientoHttpRepository implements ConsentimientoRepository {
  readonly #http: HttpClient

  constructor(http: HttpClient) {
    this.#http = http
  }

  registrar(idBeneficiario: string, politica: PoliticaDeDatos): Promise<Consentimiento> {
    return this.#http.post(
      `${rutaDelBeneficiario(idBeneficiario)}/consentimiento`,
      aCuerpoDeConsentimiento(politica),
      { esquema: esquemaConsentimiento },
    )
  }

  revocar(idBeneficiario: string, finalidad: string): Promise<RegistroConsentimiento> {
    return this.#http.post(
      `${rutaDelBeneficiario(idBeneficiario)}/consentimiento/revocacion`,
      { finalidad },
      { esquema: esquemaRegistroConsentimiento },
    )
  }

  consultarHistorial(idBeneficiario: string, finalidad: string): Promise<RegistroConsentimiento[]> {
    return this.#http.get(`${rutaDelBeneficiario(idBeneficiario)}/consentimientos`, {
      params: { finalidad },
      esquema: esquemaHistorialConsentimiento,
    })
  }
}
