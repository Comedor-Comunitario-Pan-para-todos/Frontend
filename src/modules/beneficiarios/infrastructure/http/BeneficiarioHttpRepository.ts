import { z } from 'zod'
import type {
  BeneficiarioRepository,
  CriteriosBusqueda,
  PaginaBeneficiarios,
} from '@/modules/beneficiarios/application/ports/BeneficiarioRepository.ts'
import type { Beneficiario } from '@/modules/beneficiarios/domain/Beneficiario.ts'
import type { NivelCaptura } from '@/modules/beneficiarios/domain/nivelCaptura.ts'
import type { NuevoBeneficiario } from '@/modules/beneficiarios/domain/NuevoBeneficiario.ts'
import { BeneficiarioDuplicado } from '@/modules/beneficiarios/domain/BeneficiarioDuplicado.ts'
import { esErrorApi } from '@/shared/application/errores/ErrorApi.ts'
import type { HttpClient } from '@/shared/infrastructure/http/HttpClient.ts'

const RUTA = '/beneficiarios'

const FECHA_CALENDARIO = /^\d{4}-\d{2}-\d{2}/

// Forma en que el backend entrega un beneficiario. Los campos que la app no usa se descartan.
const esquemaBeneficiarioDto = z.object({
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

type BeneficiarioDto = z.infer<typeof esquemaBeneficiarioDto>

// Compatibilidad: el backend aún no guarda el nivel. Quien tiene datos sensibles se registró en
// extendido.
function deducirNivel(dto: BeneficiarioDto): NivelCaptura {
  return dto.numeroDocumento || dto.telefono ? 'EXTENDIDO' : 'BASICO'
}

function aBeneficiario(dto: BeneficiarioDto): Beneficiario {
  return {
    id: dto.id,
    nivel: deducirNivel(dto),
    nombres: dto.nombres,
    apellidos: dto.apellidos,
    documento: dto.numeroDocumento
      ? { tipo: dto.tipoDocumento ?? '', numero: dto.numeroDocumento }
      : null,
    fechaNacimiento: dto.fechaNacimiento.slice(0, 10),
    barrio: dto.barrio || null,
    telefono: dto.telefono || null,
    clasificacion: null,
    registradoEn: dto.createdAt,
  }
}

const esquemaBeneficiario = esquemaBeneficiarioDto.transform(aBeneficiario)

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
  const basicos = {
    nombres: datos.nombres,
    apellidos: datos.apellidos,
    fechaNacimiento: datos.fechaNacimiento,
    barrio: datos.barrio ?? undefined,
  }

  if (datos.nivel === 'BASICO') return basicos

  return {
    ...basicos,
    tipoDocumento: datos.documento?.tipo,
    numeroDocumento: datos.documento?.numero,
  }
}

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
