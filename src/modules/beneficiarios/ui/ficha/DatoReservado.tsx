import { LockKeyhole } from 'lucide-react'

export function DatoReservado() {
  return (
    <span className="inline-flex items-center gap-1 text-label text-ink-secondary">
      <LockKeyhole aria-hidden="true" className="size-4 shrink-0" />
      Solo lo ve la coordinación
    </span>
  )
}
