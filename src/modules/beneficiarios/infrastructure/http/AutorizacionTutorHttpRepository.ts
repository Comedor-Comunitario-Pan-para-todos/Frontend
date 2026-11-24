import type { AutorizacionTutorRepository } from '@/modules/beneficiarios/application/ports/AutorizacionTutorRepository.ts'
import type { AutorizacionTutor } from '@/modules/beneficiarios/domain/AutorizacionTutor.ts'
import type { NuevaAutorizacionTutor } from '@/modules/beneficiarios/domain/NuevaAutorizacionTutor.ts'
import type { HttpClient } from '@/shared/infrastructure/http/HttpClient.ts'
import { aFormularioDeAutorizacionTutor } from './peticionesAutorizacionTutor.ts'
import { esquemaAutorizacionTutor } from './respuestasAutorizacionTutor.ts'

// Un PDF de 5 MB tarda unos 40 s en subir con datos móviles lentos.
const TIEMPO_PARA_SUBIR_SOPORTE_MS = 60_000

function rutaDeLaAutorizacion(idBeneficiario: string): string {
  return `/beneficiarios/${encodeURIComponent(idBeneficiario)}/autorizacion-tutor`
}

export class AutorizacionTutorHttpRepository implements AutorizacionTutorRepository {
  readonly #http: HttpClient

  constructor(http: HttpClient) {
    this.#http = http
  }

  registrar(idBeneficiario: string, datos: NuevaAutorizacionTutor): Promise<AutorizacionTutor> {
    return this.#http.post(
      rutaDeLaAutorizacion(idBeneficiario),
      aFormularioDeAutorizacionTutor(datos),
      { esquema: esquemaAutorizacionTutor, tiempoLimiteMs: TIEMPO_PARA_SUBIR_SOPORTE_MS },
    )
  }

  revocar(idBeneficiario: string, motivo: string): Promise<AutorizacionTutor> {
    return this.#http.post(
      `${rutaDeLaAutorizacion(idBeneficiario)}/revocacion`,
      { motivo },
      { esquema: esquemaAutorizacionTutor },
    )
  }
}
