interface PaginaProximamenteProps {
  readonly modulo: string
}

export function PaginaProximamente({ modulo }: PaginaProximamenteProps) {
  return (
    <div className="flex flex-col gap-2">
      <h1 className="text-heading font-semibold text-ink">{modulo}</h1>
      <p className="text-body text-ink-secondary">Este módulo estará disponible pronto.</p>
    </div>
  )
}
