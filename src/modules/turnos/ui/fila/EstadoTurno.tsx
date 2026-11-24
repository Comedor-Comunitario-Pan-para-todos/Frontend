import { Hourglass } from 'lucide-react'

/** Badge del estado del turno. Por ahora todo turno entregado queda «En espera» (HU-26). */
export function EstadoTurno() {
  return (
    <span className="inline-flex shrink-0 items-center gap-1 rounded-pill bg-primary-soft px-3 py-1 text-label font-medium text-primary">
      <Hourglass aria-hidden="true" className="size-4" />
      En espera
    </span>
  )
}
