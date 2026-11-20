import { ExportarPadron } from '@/modules/reportes/ui/exportarPadron/ExportarPadron.tsx'

/**
 * Reportes del Presidente de la JAC: el padrón para la Alcaldía (HU-22). Los demás roles ven
 * «Próximamente» hasta que tengan los suyos.
 */
export function PaginaReportes() {
  return (
    <div className="mx-auto flex w-full max-w-content flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-heading font-semibold text-ink">Reportes</h1>
        <p className="text-body text-ink-secondary">
          Genere los archivos que pide la Alcaldía para el convenio de raciones.
        </p>
      </header>

      <ExportarPadron />
    </div>
  )
}
