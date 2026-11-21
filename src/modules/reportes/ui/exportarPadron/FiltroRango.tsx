import {
  atajoDelRango,
  esAtajoDeRango,
  rangoDeAtajo,
  type AtajoDeRango,
} from '@/modules/reportes/domain/atajosDeRango.ts'
import type { ErroresDeRango, RangoFechas } from '@/modules/reportes/domain/RangoFechas.ts'
import { CampoTexto } from '@/shared/ui/CampoTexto.tsx'
import { SelectorOpciones, type OpcionSelector } from '@/shared/ui/SelectorOpciones.tsx'
import { mensajeErrorDesde, mensajeErrorHasta } from './textos.ts'

interface FiltroRangoProps {
  readonly rango: RangoFechas
  readonly hoy: string
  readonly errores: ErroresDeRango
  alCambiar(rango: RangoFechas): void
  readonly deshabilitado?: boolean
}

const OPCIONES: readonly (OpcionSelector & { readonly valor: AtajoDeRango })[] = [
  { valor: 'ESTE_MES', etiqueta: 'Este mes' },
  { valor: 'MES_PASADO', etiqueta: 'Mes pasado' },
  { valor: 'ULTIMOS_3_MESES', etiqueta: 'Últimos 3 meses' },
]

/** Rango de asistencia del padrón: atajos de un toque o fechas escritas a mano. */
export function FiltroRango({ rango, hoy, errores, alCambiar, deshabilitado }: FiltroRangoProps) {
  const atajo = atajoDelRango(rango, hoy)

  return (
    <div className="flex flex-col gap-4">
      <SelectorOpciones
        etiqueta="Personas que asistieron entre"
        name="atajo-rango"
        opciones={OPCIONES}
        envolver
        // Si las fechas se escribieron a mano, ningún atajo queda marcado.
        value={atajo ?? ''}
        disabled={deshabilitado}
        onChange={(evento) => {
          const valor = evento.target.value
          if (esAtajoDeRango(valor)) alCambiar(rangoDeAtajo(valor, hoy))
        }}
      />
      {/* Un campo por fila en teléfono; desde tablet caben los dos (DESIGN.md §4.2). */}
      <div className="grid gap-3 md:grid-cols-2">
        <CampoTexto
          etiqueta="Desde"
          type="date"
          value={rango.desde}
          max={hoy}
          disabled={deshabilitado}
          error={mensajeErrorDesde(errores.desde)}
          onChange={(evento) => alCambiar({ ...rango, desde: evento.target.value })}
        />
        <CampoTexto
          etiqueta="Hasta"
          type="date"
          value={rango.hasta}
          max={hoy}
          disabled={deshabilitado}
          error={mensajeErrorHasta(errores.hasta)}
          onChange={(evento) => alCambiar({ ...rango, hasta: evento.target.value })}
        />
      </div>
      <p className="text-label text-ink-muted">
        Al tocar un atajo se llenan las fechas. También puede escribirlas.
      </p>
    </div>
  )
}
