import { LockKeyhole, UserRound, type LucideIcon } from 'lucide-react'
import type { NivelCaptura } from '@/modules/beneficiarios/domain/nivelCaptura.ts'

interface InsigniaNivelProps {
  readonly nivel: NivelCaptura
}

const ESTILOS: Record<NivelCaptura, { texto: string; icono: LucideIcon; clases: string }> = {
  BASICO: {
    texto: 'Registro básico',
    icono: UserRound,
    clases: 'bg-surface-subtle text-ink-secondary',
  },
  EXTENDIDO: {
    texto: 'Registro extendido',
    icono: LockKeyhole,
    clases: 'bg-privacy-soft text-privacy',
  },
}

export function InsigniaNivel({ nivel }: InsigniaNivelProps) {
  const { texto, icono: Icono, clases } = ESTILOS[nivel]

  return (
    <span
      className={`inline-flex items-center gap-1 self-start rounded-pill px-3 py-1 text-label font-medium ${clases}`}
    >
      <Icono aria-hidden="true" className="size-4 shrink-0" />
      {texto}
    </span>
  )
}
