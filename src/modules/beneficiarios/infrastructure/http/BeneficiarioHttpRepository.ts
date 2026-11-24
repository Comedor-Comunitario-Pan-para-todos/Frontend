import type {
  BeneficiarioRepository,
  CriteriosBusqueda,
  PaginaBeneficiarios,
} from '@/modules/beneficiarios/application/ports/BeneficiarioRepository.ts'
import type { Beneficiario } from '@/modules/beneficiarios/domain/Beneficiario.ts'
import { BeneficiarioDuplicado } from '@/modules/beneficiarios/domain/BeneficiarioDuplicado.ts'
import type {
  DatosExtendidos,
  NuevoBeneficiario,
} from '@/modules/beneficiarios/domain/NuevoBeneficiario.ts'
import { esErrorApi } from '@/shared/application/errores/ErrorApi.ts'
import type { HttpClient } from '@/shared/infrastructure/http/HttpClient.ts'
import type { ActualizacionDeDatos } from '@/modules/beneficiarios/domain/ActualizacionDeDatos.ts'
import {
  aCuerpoDeActualizacion,
  aCuerpoDeDatosExtendidos,
  aCuerpoDeRegistro,
  aParametrosDeBusqueda,
} from './peticionesBeneficiario.ts'
import {
  esquemaBeneficiario,
  esquemaPagina,
  esquemaValidacionDocumento,
} from './respuestasBeneficiario.ts'

const RUTA = '/beneficiarios'

function rutaDe(id: string): string {
  return `${RUTA}/${encodeURIComponent(id)}`
}

function numeroDeDocumento(datos: NuevoBeneficiario): string | null {
  return datos.nivel === 'EXTENDIDO' ? (datos.documento?.numero ?? null) : null
}

function comoDuplicado(error: unknown, numeroDocumento: string | null): unknown {
  return esErrorApi(error) && error.tipo === 'conflicto'
    ? new BeneficiarioDuplicado(numeroDocumento, error)
    : error
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
      throw comoDuplicado(error, numeroDeDocumento(datos))
    }
  }

  async completarDatosExtendidos(id: string, datos: DatosExtendidos): Promise<Beneficiario> {
    try {
      return await this.#http.patch(rutaDe(id), aCuerpoDeDatosExtendidos(datos), {
        esquema: esquemaBeneficiario,
      })
    } catch (error) {
      throw comoDuplicado(error, datos.documento?.numero ?? null)
    }
  }

  async actualizarDatos(id: string, actualizacion: ActualizacionDeDatos): Promise<Beneficiario> {
    try {
      return await this.#http.patch(rutaDe(id), aCuerpoDeActualizacion(actualizacion), {
        esquema: esquemaBeneficiario,
      })
    } catch (error) {
      throw comoDuplicado(error, actualizacion.sensibles?.documento?.numero ?? null)
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
    return this.#http.get(rutaDe(id), {
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
