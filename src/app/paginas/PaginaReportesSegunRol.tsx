import { ConPermiso } from '@/modules/auth/ui/ConPermiso.tsx'
import { PaginaReportes } from '@/modules/reportes/ui/panel/PaginaReportes.tsx'
import { PaginaProximamente } from './PaginaProximamente.tsx'

/**
 * Por ahora solo la Coordinadora tiene reportes (RF-18). La JAC y los donantes siguen viendo
 * «Próximamente» hasta que se construyan los suyos (RF-16, RF-12).
 */
export function PaginaReportesSegunRol() {
  return (
    <ConPermiso
      permiso="reportes.exportarPadron"
      alternativa={<PaginaProximamente modulo="Reportes" />}
    >
      <PaginaReportes />
    </ConPermiso>
  )
}
