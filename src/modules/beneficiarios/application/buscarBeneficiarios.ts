import { normalizarNumeroDocumento } from '@/modules/beneficiarios/domain/documento.ts'
import type { BeneficiarioRepository, PaginaBeneficiarios } from './ports/BeneficiarioRepository.ts'

interface Dependencias {
  readonly repositorio: BeneficiarioRepository
}

export interface Busqueda {
  readonly texto?: string
  readonly pagina?: number
}

export type BuscarBeneficiarios = (
  busqueda?: Busqueda,
  signal?: AbortSignal,
) => Promise<PaginaBeneficiarios>

export const BENEFICIARIOS_POR_PAGINA = 20

const SOLO_NUMERO_CON_SEPARADORES = /^[\d\s.,-]*\d[\d\s.,-]*$/

/** Quien escribe "42.185.390" busca el documento 42185390, que es como está guardado. */
function prepararTexto(texto: string): string {
  const limpio = texto.replace(/\s+/g, ' ').trim()
  return SOLO_NUMERO_CON_SEPARADORES.test(limpio) ? normalizarNumeroDocumento(limpio) : limpio
}

export function crearBuscarBeneficiarios({ repositorio }: Dependencias): BuscarBeneficiarios {
  return ({ texto = '', pagina = 1 } = {}, signal) =>
    repositorio.buscar(
      { texto: prepararTexto(texto), pagina, porPagina: BENEFICIARIOS_POR_PAGINA },
      signal,
    )
}
