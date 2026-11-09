import { CircleAlert, CircleCheck, TriangleAlert, X } from 'lucide-react'
import type { AccionConstancia } from './contextoConstancia.ts'

export type TonoConstancia = 'exito' | 'fallo' | 'decision'

export interface DatosTarjeta {
  readonly tono: TonoConstancia
  readonly titulo: string
  readonly detalle?: string
  readonly accion?: AccionConstancia
}

interface TarjetaConstanciaProps {
  readonly datos: DatosTarjeta
  readonly alCerrar: () => void
}

const ESTILOS = {
  exito: { fondo: 'bg-success', Icono: CircleCheck },
  fallo: { fondo: 'bg-danger', Icono: CircleAlert },
  decision: { fondo: 'bg-warning', Icono: TriangleAlert },
}

export function TarjetaConstancia({ datos, alCerrar }: TarjetaConstanciaProps) {
  const { tono, titulo, detalle, accion } = datos
  const { fondo, Icono } = ESTILOS[tono]

  return (
    <div
      className={`pointer-events-auto w-full animate-constancia rounded-lg p-4 text-on-primary shadow-raised ${fondo}`}
    >
      <div className="flex items-start gap-3">
        <Icono aria-hidden="true" className="mt-0.5 size-6 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="text-body-lg font-semibold">{titulo}</p>
          {detalle !== undefined && <p className="text-body">{detalle}</p>}
        </div>
        {tono !== 'exito' && (
          <button
            type="button"
            aria-label="Cerrar"
            onClick={alCerrar}
            className="-mt-3 -mr-3 flex size-touch shrink-0 items-center justify-center rounded-md hover:opacity-80 focus-visible:outline-on-primary"
          >
            <X aria-hidden="true" className="size-5" />
          </button>
        )}
      </div>
      {accion !== undefined && (
        <button
          type="button"
          onClick={() => {
            alCerrar()
            accion.alPresionar()
          }}
          className="mt-3 flex min-h-touch w-full items-center justify-center rounded-md bg-surface px-6 py-2 text-body-lg font-semibold text-ink transition duration-150 ease-press hover:bg-surface-hover focus-visible:outline-on-primary active:translate-y-px active:scale-99"
        >
          {accion.etiqueta}
        </button>
      )}
    </div>
  )
}
