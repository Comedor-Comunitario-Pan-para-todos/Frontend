import { formatearFechaYHora } from './formatearFechaYHora.ts'

interface LineaDeAuditoriaProps {
  readonly momento: string
  readonly autor: string
  readonly versionPolitica?: number
}

export function LineaDeAuditoria({ momento, autor, versionPolitica }: LineaDeAuditoriaProps) {
  return (
    <p className="flex flex-col text-label text-ink-secondary sm:flex-row sm:flex-wrap sm:gap-x-2">
      <span className="font-mono">{formatearFechaYHora(momento)}</span>
      <span aria-hidden="true" className="hidden sm:inline">
        ·
      </span>
      <span>
        <span className="sr-only">Anotada por </span>
        <span>{autor}</span>
        {versionPolitica !== undefined && (
          <>
            <span aria-hidden="true"> · </span>
            <span className="sr-only">, </span>
            <span>Política v{versionPolitica}</span>
          </>
        )}
      </span>
    </p>
  )
}
