import { FlaskConical } from 'lucide-react'

export function AvisoDemo() {
  return (
    <p className="flex items-center justify-center gap-2 bg-warning-soft px-gutter pt-safe pb-1 text-body font-medium text-warning">
      <FlaskConical aria-hidden="true" className="size-5 shrink-0" />
      Demostración: datos de prueba que se borran al recargar.
    </p>
  )
}
