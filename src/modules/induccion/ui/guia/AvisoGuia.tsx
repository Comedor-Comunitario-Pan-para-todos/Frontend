import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

interface AvisoGuiaProps {
  readonly icono: LucideIcon
  readonly tono: 'peligro' | 'neutro'
  readonly titulo: string
  readonly children: ReactNode
  readonly accion?: ReactNode
}

const TONOS = {
  peligro: { fondo: 'bg-danger-soft', color: 'text-danger' },
  neutro: { fondo: 'bg-surface-subtle', color: 'text-ink-muted' },
}

/** Tarjeta centrada para cuando la guía no se puede mostrar (error o sin temas). */
export function AvisoGuia({ icono: Icono, tono, titulo, children, accion }: AvisoGuiaProps) {
  const { fondo, color } = TONOS[tono]

  return (
    <div
      role={tono === 'peligro' ? 'alert' : 'status'}
      className="flex flex-col items-center gap-3 rounded-lg border border-hairline bg-surface px-5 pt-8 pb-6 text-center shadow-card"
    >
      <span className={`flex size-14 rounded-pill ${fondo}`}>
        <Icono aria-hidden="true" className={`m-auto size-7 ${color}`} />
      </span>
      <p className="text-body-lg font-semibold text-ink">{titulo}</p>
      <p className="text-body text-ink-secondary">{children}</p>
      {accion}
    </div>
  )
}
