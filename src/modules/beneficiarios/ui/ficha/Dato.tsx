import type { ReactNode } from 'react'

interface DatoProps {
  readonly nombre: string
  readonly ancho?: boolean
  readonly children: ReactNode
}

export function Dato({ nombre, ancho = false, children }: DatoProps) {
  return (
    <div className={`flex min-w-0 flex-col ${ancho ? 'col-span-2' : ''}`}>
      <dt className="text-label text-ink-muted">{nombre}</dt>
      <dd className="text-body wrap-break-word text-ink">{children}</dd>
    </div>
  )
}
