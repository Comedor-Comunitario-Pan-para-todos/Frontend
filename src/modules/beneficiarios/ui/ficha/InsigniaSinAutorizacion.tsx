import { ShieldAlert } from 'lucide-react'

export function InsigniaSinAutorizacion() {
  return (
    <span className="inline-flex items-center gap-1 self-start rounded-pill bg-warning-soft px-3 py-1 text-label font-medium text-warning">
      <ShieldAlert aria-hidden="true" className="size-4 shrink-0" />
      Falta autorización de datos
    </span>
  )
}
