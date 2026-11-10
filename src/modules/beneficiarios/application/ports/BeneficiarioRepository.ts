import type {
  Beneficiario,
  NuevoBeneficiario,
} from '@/modules/beneficiarios/domain/Beneficiario.ts'

export interface CriteriosBusqueda {
  /** Parte del nombre, del apellido o del número de documento. Vacío trae a todos. */
  readonly texto: string
  /** Empieza en 1. */
  readonly pagina: number
  readonly porPagina: number
}

export interface PaginaBeneficiarios {
  readonly beneficiarios: readonly Beneficiario[]
  /** Personas que cumplen la búsqueda, sumando todas las páginas. */
  readonly total: number
  readonly pagina: number
  readonly totalPaginas: number
}

export interface BeneficiarioRepository {
  /** Lanza `BeneficiarioDuplicado` si la persona ya está en el padrón. */
  registrar(datos: NuevoBeneficiario): Promise<Beneficiario>
  buscar(criterios: CriteriosBusqueda, signal?: AbortSignal): Promise<PaginaBeneficiarios>
  consultarPorId(id: string, signal?: AbortSignal): Promise<Beneficiario>
  /** `null` si nadie tiene ese número de documento. */
  buscarPorDocumento(numero: string, signal?: AbortSignal): Promise<Beneficiario | null>
}
