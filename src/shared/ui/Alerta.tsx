import {
  CircleCheck,
  OctagonAlert,
  ShieldCheck,
  TriangleAlert,
  type LucideIcon,
} from 'lucide-react'
import type { ReactNode } from 'react'

type TipoAlerta = 'exito' | 'aviso' | 'peligro' | 'privacidad'

interface AlertaProps {
  readonly tipo: TipoAlerta
  readonly titulo?: string
  readonly children: ReactNode
}

const ESTILOS: Record<TipoAlerta, { icono: LucideIcon; fondo: string; tono: string }> = {
  exito: { icono: CircleCheck, fondo: 'bg-success-soft', tono: 'text-success' },
  aviso: { icono: TriangleAlert, fondo: 'bg-warning-soft', tono: 'text-warning' },
  peligro: { icono: OctagonAlert, fondo: 'bg-danger-soft', tono: 'text-danger' },
  privacidad: { icono: ShieldCheck, fondo: 'bg-privacy-soft', tono: 'text-privacy' },
}

export function Alerta({ tipo, titulo, children }: AlertaProps) {
  const { icono: Icono, fondo, tono } = ESTILOS[tipo]

  return (
    <div
      role={tipo === 'peligro' ? 'alert' : 'status'}
      className={`flex items-start gap-3 rounded-md p-4 ${fondo}`}
    >
      <Icono aria-hidden="true" className={`mt-0.5 size-5 shrink-0 ${tono}`} />
      <div className="flex min-w-0 flex-col gap-1 text-body text-ink">
        {titulo && <p className={`font-semibold ${tono}`}>{titulo}</p>}
        <div>{children}</div>
      </div>
    </div>
  )
}
