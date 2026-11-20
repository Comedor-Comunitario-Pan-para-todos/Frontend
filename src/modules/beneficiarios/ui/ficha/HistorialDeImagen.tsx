import { CameraOff, ChevronDown, CircleCheck } from 'lucide-react'
import { useState } from 'react'
import {
  movimientosDeAutorizacion,
  type MovimientoDeAutorizacion,
} from '@/modules/beneficiarios/domain/movimientosDeAutorizacion.ts'
import { Alerta } from '@/shared/ui/Alerta.tsx'
import { Boton } from '@/shared/ui/Boton.tsx'
import { mensajeDeError } from '@/shared/ui/mensajeDeError.ts'
import { formatearFechaYHora } from './formatearFechaYHora.ts'
import { useHistorialDeImagen } from './useHistorialDeImagen.ts'

interface HistorialDeImagenProps {
  readonly idBeneficiario: string
}

const MOVIMIENTO = {
  AUTORIZO: { texto: 'Autorizó', Icono: CircleCheck, color: 'text-success' },
  RETIRO: { texto: 'Retiró', Icono: CameraOff, color: 'text-privacy' },
}

function Movimiento({ tipo, momento, usuario }: MovimientoDeAutorizacion) {
  const { texto, Icono, color } = MOVIMIENTO[tipo]

  return (
    <li className="flex items-start gap-2">
      <Icono aria-hidden="true" className={`mt-0.5 size-5 shrink-0 ${color}`} />
      <div className="flex min-w-0 flex-col">
        <span className="text-body font-medium text-ink">{texto}</span>
        <span className="font-mono text-label text-ink-secondary">
          {formatearFechaYHora(momento)}
        </span>
        <span className="text-label text-ink-muted">Anotado por {usuario}</span>
      </div>
    </li>
  )
}

export function HistorialDeImagen({ idBeneficiario }: HistorialDeImagenProps) {
  const [abierto, setAbierto] = useState(false)
  const historial = useHistorialDeImagen(idBeneficiario, abierto)

  return (
    <details
      className="group border-t border-hairline pt-1"
      onToggle={(evento) => setAbierto(evento.currentTarget.open)}
    >
      <summary className="flex min-h-touch cursor-pointer items-center justify-between gap-2 text-body font-semibold text-primary">
        Ver historial
        <ChevronDown
          aria-hidden="true"
          className="size-5 shrink-0 transition duration-150 ease-press group-open:rotate-180"
        />
      </summary>
      <div className="flex flex-col gap-3 pb-1">
        {historial.isPending && abierto && (
          <p role="status" className="text-body text-ink-secondary">
            Cargando el historial…
          </p>
        )}
        {historial.isError && (
          <>
            <Alerta tipo="peligro" titulo="No pudimos cargar el historial">
              {mensajeDeError(historial.error)}
            </Alerta>
            <Boton
              variante="secundario"
              cargando={historial.isFetching}
              onClick={() => void historial.refetch()}
            >
              Reintentar
            </Boton>
          </>
        )}
        {historial.data?.length === 0 && (
          <p className="text-body text-ink-secondary">Todavía no hay cambios.</p>
        )}
        {historial.data && historial.data.length > 0 && (
          <ol className="flex flex-col gap-3">
            {movimientosDeAutorizacion(historial.data).map((movimiento) => (
              <Movimiento key={`${movimiento.tipo}-${movimiento.momento}`} {...movimiento} />
            ))}
          </ol>
        )}
      </div>
    </details>
  )
}
