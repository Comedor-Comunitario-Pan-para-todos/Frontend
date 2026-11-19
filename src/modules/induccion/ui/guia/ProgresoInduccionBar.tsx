import { CircleCheckBig, CloudCheck } from 'lucide-react'
import type { AvanceInduccion } from '@/modules/induccion/domain/avanceInduccion.ts'
import { BarraAvance } from '@/modules/induccion/ui/avance/BarraAvance.tsx'
import { textoDeTemas } from '@/modules/induccion/ui/avance/textos.ts'

interface ProgresoInduccionBarProps {
  readonly avance: AvanceInduccion
}

export function ProgresoInduccionBar({ avance }: ProgresoInduccionBarProps) {
  const { leidos, total, completa } = avance

  return (
    <section
      aria-label="Tu avance"
      className="flex flex-col gap-3 rounded-lg border border-hairline bg-surface p-4 shadow-card"
    >
      <p className="flex items-baseline justify-between gap-3">
        <span className="text-body font-semibold text-ink">Tu avance</span>
        <span className={`font-mono text-label ${completa ? 'text-success' : 'text-primary'}`}>
          {leidos} de {textoDeTemas(total)}
        </span>
      </p>
      <BarraAvance avance={avance} />
      {completa ? (
        <p className="flex items-center gap-2 text-label text-success">
          <CircleCheckBig aria-hidden="true" className="size-4 shrink-0" />
          Completaste {textoDeTemas(total)}
        </p>
      ) : (
        <p className="flex items-center gap-2 text-label text-ink-secondary">
          <CloudCheck aria-hidden="true" className="size-4 shrink-0" />
          Tu avance se guarda solo. Puedes seguir otro día.
        </p>
      )}
    </section>
  )
}
