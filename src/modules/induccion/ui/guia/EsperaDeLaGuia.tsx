const CLASES_TARJETA = 'rounded-lg border border-hairline bg-surface shadow-card'

export function EsperaDeLaGuia() {
  return (
    <div aria-hidden="true" className="flex animate-pulse flex-col gap-3">
      <div className={`flex flex-col gap-3 p-4 ${CLASES_TARJETA}`}>
        <span className="h-4 w-1/2 rounded-sm bg-surface-hover" />
        <span className="h-3 w-full rounded-pill bg-surface-hover" />
      </div>
      {[0, 1, 2, 3].map((fila) => (
        <div key={fila} className={`flex items-center gap-3 p-4 ${CLASES_TARJETA}`}>
          <span className="size-11 shrink-0 rounded-sm bg-surface-hover" />
          <span className="flex flex-1 flex-col gap-2">
            <span className="h-4 w-3/4 rounded-sm bg-surface-hover" />
            <span className="h-3 w-1/3 rounded-sm bg-surface-hover" />
          </span>
        </div>
      ))}
    </div>
  )
}
