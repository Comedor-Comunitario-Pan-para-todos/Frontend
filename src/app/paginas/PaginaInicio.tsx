import { ConPermiso } from '@/modules/auth/ui/ConPermiso.tsx'
import { InduccionPendienteCard } from '@/modules/induccion/ui/acceso/InduccionPendienteCard.tsx'
import { PaginaProximamente } from './PaginaProximamente.tsx'

/**
 * El Inicio todavía no tiene contenido propio. Mientras tanto muestra el acceso a la guía de
 * inducción (RF-15) a quien le falte leerla.
 */
export function PaginaInicio() {
  return (
    <div className="mx-auto flex w-full max-w-content flex-col gap-6">
      <PaginaProximamente modulo="Inicio" />
      <ConPermiso permiso="induccion.ver">
        <InduccionPendienteCard />
      </ConPermiso>
    </div>
  )
}
