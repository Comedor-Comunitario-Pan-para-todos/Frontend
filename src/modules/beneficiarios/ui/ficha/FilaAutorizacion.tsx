import type { LucideIcon } from 'lucide-react'
import { useId, type ReactNode } from 'react'
import { useRecuperarFoco } from '@/shared/ui/useRecuperarFoco.ts'

export type TonoDeEstado = 'exito' | 'aviso' | 'privacidad' | 'neutro'

export interface EstadoDeAutorizacion {
  readonly texto: string
  readonly icono: LucideIcon
  readonly tono: TonoDeEstado
}

const TONOS: Record<TonoDeEstado, { mosaico: string; texto: string }> = {
  exito: { mosaico: 'bg-success-soft text-success', texto: 'text-success' },
  aviso: { mosaico: 'bg-warning-soft text-warning', texto: 'text-warning' },
  privacidad: { mosaico: 'bg-privacy-soft text-privacy', texto: 'text-privacy' },
  neutro: { mosaico: 'bg-surface-subtle text-ink-secondary', texto: 'text-ink-secondary' },
}

interface FilaAutorizacionProps {
  readonly titulo: string
  readonly estado: EstadoDeAutorizacion
  readonly detalle?: ReactNode
  readonly accion?: ReactNode
  readonly children?: ReactNode
}

export function FilaAutorizacion({
  titulo,
  estado,
  detalle,
  accion,
  children,
}: FilaAutorizacionProps) {
  const idTitulo = useId()
  const encabezado = useRecuperarFoco<HTMLHeadingElement>(estado.texto)
  const tono = TONOS[estado.tono]
  const Icono = estado.icono

  return (
    <section aria-labelledby={idTitulo} className="flex gap-3 py-4 first:pt-0 last:pb-0 md:gap-4">
      <span
        className={`flex size-10 shrink-0 items-center justify-center rounded-md ${tono.mosaico}`}
      >
        <Icono aria-hidden="true" className="size-5" />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between md:gap-6">
          <div className="flex min-w-0 flex-col">
            <h3
              id={idTitulo}
              ref={encabezado}
              tabIndex={-1}
              className="rounded-sm text-body font-semibold text-ink"
            >
              {titulo}
            </h3>
            <p className={`text-label font-medium ${tono.texto}`}>{estado.texto}</p>
            {detalle && <div className="mt-1">{detalle}</div>}
          </div>
          {accion && <div className="flex flex-col md:w-60 md:shrink-0">{accion}</div>}
        </div>
        {children}
      </div>
    </section>
  )
}
