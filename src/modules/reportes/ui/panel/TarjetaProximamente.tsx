import { Clock } from 'lucide-react'
import { useId } from 'react'

interface TarjetaProximamenteProps {
  readonly titulo: string
  readonly descripcion: string
}

/** Reporte que todavía no está construido: se anuncia para que la coordinadora sepa que viene. */
export function TarjetaProximamente({ titulo, descripcion }: TarjetaProximamenteProps) {
  const idTitulo = useId()

  return (
    <section
      aria-labelledby={idTitulo}
      className="flex items-start gap-3 rounded-lg border border-hairline bg-surface-subtle p-4 md:p-6"
    >
      <span className="flex size-8 shrink-0 items-center justify-center rounded-sm bg-surface-hover">
        <Clock aria-hidden="true" className="size-4 text-ink-muted" />
      </span>
      <div className="flex min-w-0 flex-1 flex-col items-start gap-2">
        <h2 id={idTitulo} className="text-body-lg font-semibold text-ink-secondary">
          {titulo}
        </h2>
        <span className="rounded-pill bg-surface-hover px-3 py-1 text-label font-medium text-ink-muted">
          Próximamente
        </span>
        <p className="text-body text-ink-muted">{descripcion}</p>
      </div>
    </section>
  )
}
