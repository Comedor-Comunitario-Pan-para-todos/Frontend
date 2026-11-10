import { z } from 'zod'
import type {
  BeneficiarioRepository,
  CriteriosBusqueda,
  PaginaBeneficiarios,
} from '@/modules/beneficiarios/application/ports/BeneficiarioRepository.ts'
import type {
  Beneficiario,
  NuevoBeneficiario,
} from '@/modules/beneficiarios/domain/Beneficiario.ts'
import { BeneficiarioDuplicado } from '@/modules/beneficiarios/domain/BeneficiarioDuplicado.ts'
import { esErrorApi } from '@/shared/application/errores/ErrorApi.ts'
import type { HttpClient } from '@/shared/infrastructure/http/HttpClient.ts'

const RUTA = '/beneficiarios'

const FECHA_CALENDARIO = /^\d{4}-\d{2}-\d{2}/

// Forma en que el backend entrega un beneficiario. Los campos que la app no usa se descartan.
const esquemaBeneficiario = z
  .object({
    id: z.string().min(1),
    tipoDocumento: z.string().nullish(),
    numeroDocumento: z.string().nullish(),
    nombres: z.string(),
    apellidos: z.string(),
    // Puede llegar "1958-03-15" o con hora ("1958-03-15T00:00:00.000Z"): se conserva solo el día.
    fechaNacimiento: z.string().regex(FECHA_CALENDARIO),
    barrio: z.string().nullish(),
    telefono: z.string().nullish(),
    createdAt: z.string(),
  })
  .transform((dto): Beneficiario => ({
    id: dto.id,
    nombres: dto.nombres,
    apellidos: dto.apellidos,
    documento: dto.numeroDocumento
      ? { tipo: dto.tipoDocumento ?? '', numero: dto.numeroDocumento }
      : null,
    fechaNacimiento: dto.fechaNacimiento.slice(0, 10),
    barrio: dto.barrio || null,
    telefono: dto.telefono || null,
    registradoEn: dto.createdAt,
  }))

const esquemaPagina = z
  .object({
    data: z.array(esquemaBeneficiario),
    meta: z.object({
      total: z.number(),
      page: z.number(),
      totalPages: z.number(),
    }),
  })
  .transform(({ data, meta }): PaginaBeneficiarios => ({
    beneficiarios: data,
    total: meta.total,
    pagina: meta.page,
    totalPaginas: meta.totalPages,
  }))

const esquemaValidacionDocumento = z
  .object({ beneficiario: esquemaBeneficiario.nullable() })
  .transform(({ beneficiario }) => beneficiario)

/** Cuerpo de `POST /beneficiarios`. El backend rechaza cualquier campo que no conozca. */
function aCuerpoDeRegistro(datos: NuevoBeneficiario) {
  return {
    tipoDocumento: datos.documento?.tipo,
    numeroDocumento: datos.documento?.numero,
    nombres: datos.nombres,
    apellidos: datos.apellidos,
    fechaNacimiento: datos.fechaNacimiento,
    barrio: datos.barrio ?? undefined,
  }
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
        throw new BeneficiarioDuplicado(datos.documento?.numero ?? null, error)
      }
      throw error
    }
  }

  buscar(criterios: CriteriosBusqueda, signal?: AbortSignal): Promise<PaginaBeneficiarios> {
    return this.#http.get(RUTA, {
      esquema: esquemaPagina,
      params: {
        search: criterios.texto === '' ? undefined : criterios.texto,
        page: criterios.pagina,
        limit: criterios.porPagina,
      },
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
