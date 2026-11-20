import type { RangoFechas } from './RangoFechas.ts'

/** Rangos de uso frecuente para el reporte a la Alcaldía, que se eligen con un toque. */
export const ATAJOS_DE_RANGO = ['ESTE_MES', 'MES_PASADO', 'ULTIMOS_3_MESES'] as const

export type AtajoDeRango = (typeof ATAJOS_DE_RANGO)[number]

interface Dia {
  readonly anio: number
  readonly mes: number
  readonly dia: number
}

function leer(fecha: string): Dia {
  const [anio, mes, dia] = fecha.split('-').map(Number) as [number, number, number]
  return { anio, mes, dia }
}

function escribir(anio: number, mes: number, dia: number): string {
  // Date.UTC corrige los meses fuera de rango (mes 0 = diciembre del año anterior).
  const fecha = new Date(Date.UTC(anio, mes - 1, dia))
  return fecha.toISOString().slice(0, 10)
}

export function esAtajoDeRango(valor: string): valor is AtajoDeRango {
  return (ATAJOS_DE_RANGO as readonly string[]).includes(valor)
}

/**
 * Las fechas de cada atajo, contando meses de calendario:
 * * `ESTE_MES`: del 1 del mes actual hasta hoy.
 * * `MES_PASADO`: el mes anterior completo.
 * * `ULTIMOS_3_MESES`: del 1 de hace dos meses hasta hoy (el mes actual y los dos anteriores).
 */
export function rangoDeAtajo(atajo: AtajoDeRango, hoy: string): RangoFechas {
  const { anio, mes } = leer(hoy)

  switch (atajo) {
    case 'ESTE_MES':
      return { desde: escribir(anio, mes, 1), hasta: hoy }
    case 'MES_PASADO':
      // El día 0 de este mes es el último día del mes anterior.
      return { desde: escribir(anio, mes - 1, 1), hasta: escribir(anio, mes, 0) }
    case 'ULTIMOS_3_MESES':
      return { desde: escribir(anio, mes - 2, 1), hasta: hoy }
  }
}

/** El atajo que produce exactamente este rango, o `null` si las fechas se escribieron a mano. */
export function atajoDelRango(rango: RangoFechas, hoy: string): AtajoDeRango | null {
  return (
    ATAJOS_DE_RANGO.find((atajo) => {
      const delAtajo = rangoDeAtajo(atajo, hoy)
      return delAtajo.desde === rango.desde && delAtajo.hasta === rango.hasta
    }) ?? null
  )
}
