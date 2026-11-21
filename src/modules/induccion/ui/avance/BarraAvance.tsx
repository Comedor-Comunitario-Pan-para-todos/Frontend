import type { AvanceInduccion } from '@/modules/induccion/domain/avanceInduccion.ts'

interface BarraAvanceProps {
  readonly avance: AvanceInduccion
  readonly className?: string
}

const CLASES_BARRA =
  'w-full appearance-none overflow-hidden rounded-pill bg-surface-hover [&::-webkit-progress-bar]:bg-surface-hover [&::-webkit-progress-value]:rounded-pill'

const CLASES_COLOR = {
  enCurso: '[&::-moz-progress-bar]:bg-primary [&::-webkit-progress-value]:bg-primary',
  completa: '[&::-moz-progress-bar]:bg-success [&::-webkit-progress-value]:bg-success',
}

export function BarraAvance({ avance, className = 'h-3' }: BarraAvanceProps) {
  const color = avance.completa ? CLASES_COLOR.completa : CLASES_COLOR.enCurso

  return (
    <progress
      aria-label="Avance de la inducción"
      max={avance.total}
      value={avance.leidos}
      className={`${CLASES_BARRA} ${color} ${className}`}
    />
  )
}
