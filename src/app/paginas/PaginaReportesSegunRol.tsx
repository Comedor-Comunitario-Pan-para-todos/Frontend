import { ConPermiso } from '@/modules/auth/ui/ConPermiso.tsx'
import { PaginaReportes } from '@/modules/reportes/ui/panel/PaginaReportes.tsx'
import { PaginaProximamente } from './PaginaProximamente.tsx'

/**
 * Por ahora el único reporte construido es el padrón para la Alcaldía, que exporta el Presidente
 * de la JAC (RF-18, HU-22). La Coordinadora y los donantes siguen viendo «Próximamente» hasta
 * que se construyan los suyos (RF-16, RF-17).
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
