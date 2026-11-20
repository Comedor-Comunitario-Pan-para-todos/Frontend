import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { useDependencias } from '@/app/contextoDependencias.ts'
import type { RangoFechas } from '@/modules/reportes/domain/RangoFechas.ts'
import { useConstancia } from '@/shared/ui/constancia/contextoConstancia.ts'
import { mensajeDeError } from '@/shared/ui/mensajeDeError.ts'
import { textoDePersonas, textoDelRango } from './textos.ts'

export interface ExportacionPadron {
  /** Genera y descarga el archivo. `incluidas` solo se usa en el mensaje de la constancia. */
  exportar(rango: RangoFechas, incluidas: number): void
  readonly generando: boolean
  /** Avance de la descarga entre 0 y 1, o `null` si todavía no se sabe. */
  readonly avance: number | null
}

/**
 * Pide el padrón al servidor y lo descarga. El resultado se avisa con la Constancia: si falla,
 * «Reintentar» vuelve a pedir el mismo rango, que el Presidente de la JAC ya confirmó.
 */
export function useExportarPadron(): ExportacionPadron {
  const { exportarPadron } = useDependencias()
  const constancia = useConstancia()
  const [avance, setAvance] = useState<number | null>(null)

  const mutacion = useMutation({
    mutationFn: (rango: RangoFechas) =>
      exportarPadron({ rango, responsabilidadAceptada: true, alAvanzar: setAvance }),
  })

  function exportar(rango: RangoFechas, incluidas: number) {
    setAvance(null)
    constancia.cerrar()
    mutacion.mutate(rango, {
      onSuccess: () =>
        constancia.confirmar({
          titulo: 'Archivo descargado',
          detalle: `${textoDePersonas(incluidas)} · ${textoDelRango(rango)}. Búsquelo en las descargas del teléfono.`,
          resumen: 'Padrón descargado',
        }),
      onError: (error) =>
        constancia.avisarFallo({
          titulo: 'No se pudo generar el archivo',
          detalle: `${mensajeDeError(error)} Las fechas que eligió se conservan.`,
          reintentar: () => exportar(rango, incluidas),
        }),
    })
  }

  return { exportar, generando: mutacion.isPending, avance }
}
