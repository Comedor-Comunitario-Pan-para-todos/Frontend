import type {
  BeneficiarioRepository,
  CriteriosBusqueda,
  PaginaBeneficiarios,
} from '@/modules/beneficiarios/application/ports/BeneficiarioRepository.ts'
import type { Beneficiario } from '@/modules/beneficiarios/domain/Beneficiario.ts'
import { BeneficiarioDuplicado } from '@/modules/beneficiarios/domain/BeneficiarioDuplicado.ts'
import type { NuevoBeneficiario } from '@/modules/beneficiarios/domain/NuevoBeneficiario.ts'
import { esErrorApi } from '@/shared/application/errores/ErrorApi.ts'
import type { HttpClient } from '@/shared/infrastructure/http/HttpClient.ts'
import { aCuerpoDeRegistro, aParametrosDeBusqueda } from './peticionesBeneficiario.ts'
import {
  esquemaBeneficiario,
  esquemaPagina,
  esquemaValidacionDocumento,
} from './respuestasBeneficiario.ts'

const RUTA = '/beneficiarios'

function numeroDeDocumento(datos: NuevoBeneficiario): string | null {
  return datos.nivel === 'EXTENDIDO' ? (datos.documento?.numero ?? null) : null
}

export class BeneficiarioHttpRepository implements BeneficiarioRepository {
  readonly #http: HttpClient

  constructor(http: HttpClient) {
    this.#http = http
  }

  async registrar(datos: NuevoBeneficiario): Promise<Beneficiario> {
    try {
      return await this.#http.post(RUTA, aCuerpoDeRegistro(datos), { esquema: esquemaBeneficiario })
    } catch (error) {
      if (esErrorApi(error) && error.tipo === 'conflicto') {
        throw new BeneficiarioDuplicado(numeroDeDocumento(datos), error)
      }
      throw error
    }
  }

  buscar(criterios: CriteriosBusqueda, signal?: AbortSignal): Promise<PaginaBeneficiarios> {
    return this.#http.get(RUTA, {
      esquema: esquemaPagina,
      params: aParametrosDeBusqueda(criterios),
      signal,
    })
  }

  consultarPorId(id: string, signal?: AbortSignal): Promise<Beneficiario> {
    return this.#http.get(`${RUTA}/${encodeURIComponent(id)}`, {
      esquema: esquemaBeneficiario,
      signal,
    })
  }

  buscarPorDocumento(numero: string, signal?: AbortSignal): Promise<Beneficiario | null> {
    return this.#http.get(`${RUTA}/validar-documento/${encodeURIComponent(numero)}`, {
      esquema: esquemaValidacionDocumento,
      signal,
    })
  }
}
