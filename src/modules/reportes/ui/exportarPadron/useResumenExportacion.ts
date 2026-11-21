import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useDependencias } from '@/app/contextoDependencias.ts'
import type { RangoFechas } from '@/modules/reportes/domain/RangoFechas.ts'
import type { ResumenExportacion } from '@/modules/reportes/domain/ResumenExportacion.ts'

export type EstadoResumen =
  /** El rango tiene errores: no se consulta. */
  | { readonly estado: 'sin-rango' }
  | { readonly estado: 'cargando' }
  | { readonly estado: 'error'; readonly error: unknown; reintentar(): void }
  | {
      readonly estado: 'listo'
      readonly resumen: ResumenExportacion
      /** Llegó otro rango y se está contando: lo que se ve es del rango anterior. */
      readonly actualizando: boolean
    }

/** Cuántas personas entrarían en el archivo del rango. Solo consulta si el rango es válido. */
export function useResumenExportacion(rango: RangoFechas, rangoValido: boolean): EstadoResumen {
  const { consultarResumenExportacion } = useDependencias()

  const consulta = useQuery({
    queryKey: ['reportes', 'resumen-padron', rango.desde, rango.hasta],
    queryFn: ({ signal }) => consultarResumenExportacion(rango, signal),
    enabled: rangoValido,
    // Mientras se cuenta el rango nuevo, se conservan las cifras anteriores para que no parpadeen.
    placeholderData: keepPreviousData,
  })

  if (!rangoValido) return { estado: 'sin-rango' }
  if (consulta.data === undefined) {
    return consulta.isError
      ? { estado: 'error', error: consulta.error, reintentar: () => void consulta.refetch() }
      : { estado: 'cargando' }
  }
  return { estado: 'listo', resumen: consulta.data, actualizando: consulta.isPlaceholderData }
}
