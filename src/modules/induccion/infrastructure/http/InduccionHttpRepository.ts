import type { InduccionRepository } from '@/modules/induccion/application/ports/InduccionRepository.ts'
import type { GuiaInduccion, ProgresoInduccion } from '@/modules/induccion/domain/GuiaInduccion.ts'
import type { HttpClient } from '@/shared/infrastructure/http/HttpClient.ts'
import { esquemaGuia, esquemaProgreso } from './respuestasInduccion.ts'

export class InduccionHttpRepository implements InduccionRepository {
  readonly #http: HttpClient

  constructor(http: HttpClient) {
    this.#http = http
  }

  consultar(): Promise<GuiaInduccion> {
    return this.#http.get('/induccion', { esquema: esquemaGuia })
  }

  registrarLectura(idModulo: string, leido: boolean): Promise<ProgresoInduccion> {
    return this.#http.patch(
      '/induccion/progreso',
      { moduloId: idModulo, leido },
      { esquema: esquemaProgreso },
    )
  }
}
