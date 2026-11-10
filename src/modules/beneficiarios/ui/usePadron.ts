import { keepPreviousData, useInfiniteQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useDependencias } from '@/app/contextoDependencias.ts'
import type { Beneficiario } from '@/modules/beneficiarios/domain/Beneficiario.ts'
import { useValorRetrasado } from './useValorRetrasado.ts'

// Lo que se espera a que la persona deje de escribir antes de consultar al servidor.
const RETRASO_BUSQUEDA_MS = 300

export interface Padron {
  /** Lo que está escrito en el buscador. */
  readonly texto: string
  cambiarTexto(texto: string): void
  /** El texto con el que se hizo la última consulta; va un poco detrás de `texto`. */
  readonly textoBuscado: string
  /** `cargando`: aún no hay nada que mostrar. `error`: la consulta falló y no hay datos. */
  readonly estado: 'cargando' | 'error' | 'listo'
  /** Hay una búsqueda en camino: lo que se ve puede ser de la búsqueda anterior. */
  readonly buscando: boolean
  readonly beneficiarios: readonly Beneficiario[]
  /** Personas que cumplen la búsqueda, no solo las que ya se cargaron. */
  readonly total: number
  readonly error: unknown
  reintentar(): void
  readonly hayMas: boolean
  readonly cargandoMas: boolean
  /** Falló la carga de la página siguiente; las personas ya cargadas siguen en pantalla. */
  readonly falloAlCargarMas: boolean
  cargarMas(): void
}

/** Estado de la pantalla del padrón: lo que se busca y las personas que van llegando por páginas. */
export function usePadron(): Padron {
  const { buscarBeneficiarios } = useDependencias()
  const [texto, setTexto] = useState('')
  const escrito = texto.trim()
  const retrasado = useValorRetrasado(escrito, RETRASO_BUSQUEDA_MS)
  // Al borrar el buscador no se espera: el padrón completo vuelve de inmediato.
  const textoBuscado = escrito === '' ? '' : retrasado

  const consulta = useInfiniteQuery({
    queryKey: ['beneficiarios', 'lista', textoBuscado],
    queryFn: ({ pageParam, signal }) =>
      buscarBeneficiarios({ texto: textoBuscado, pagina: pageParam }, signal),
    initialPageParam: 1,
    getNextPageParam: ({ pagina, totalPaginas }) =>
      pagina < totalPaginas ? pagina + 1 : undefined,
    // Mientras llega la búsqueda nueva se conserva la lista anterior, para que no parpadee.
    placeholderData: keepPreviousData,
  })

  const paginas = consulta.data?.pages ?? []
  const sinDatos = consulta.data === undefined

  return {
    texto,
    cambiarTexto: setTexto,
    textoBuscado,
    estado: sinDatos ? (consulta.isError ? 'error' : 'cargando') : 'listo',
    buscando: escrito !== textoBuscado || consulta.isPlaceholderData,
    beneficiarios: paginas.flatMap((pagina) => pagina.beneficiarios),
    total: paginas.at(-1)?.total ?? 0,
    error: consulta.error,
    reintentar: () => void consulta.refetch(),
    hayMas: consulta.hasNextPage,
    cargandoMas: consulta.isFetchingNextPage,
    falloAlCargarMas: consulta.isFetchNextPageError,
    cargarMas: () => void consulta.fetchNextPage(),
  }
}
