import { ChevronDown } from 'lucide-react'
import type { PoliticaVigente } from '@/modules/beneficiarios/domain/politicaVigente.ts'

interface PoliticaTratamientoProps {
  readonly politica: PoliticaVigente
}

/** Una política en lenguaje claro: un resumen y, al tocar, el texto completo. */
export function PoliticaTratamiento({ politica }: PoliticaTratamientoProps) {
  const { nombre, version, resumen, puntos } = politica

  return (
    <div className="flex flex-col gap-2 rounded-md bg-surface-subtle px-3 py-2">
      <p className="text-body text-ink">{resumen}</p>
      <details className="group">
        <summary className="flex min-h-touch cursor-pointer items-center justify-between gap-2 text-body font-semibold text-primary">
          Leer la política completa
          <ChevronDown
            aria-hidden="true"
            className="size-5 shrink-0 transition duration-150 ease-press group-open:rotate-180"
          />
        </summary>
        <dl className="flex flex-col gap-3 pb-2">
          {puntos.map(({ titulo, texto }) => (
            <div key={titulo}>
              <dt className="text-label font-semibold text-ink">{titulo}</dt>
              <dd className="text-body text-ink-secondary">{texto}</dd>
            </div>
          ))}
        </dl>
      </details>
      <p className="font-mono text-caption text-ink-muted">
        {nombre} · versión {version}
      </p>
    </div>
  )
}
