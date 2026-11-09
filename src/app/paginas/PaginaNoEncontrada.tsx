import { House } from 'lucide-react'
import { Link } from 'react-router'

const CLASES_MUESCA =
  'absolute top-0 size-6 -translate-y-1/2 rounded-pill border border-hairline bg-canvas'

export function PaginaNoEncontrada() {
  return (
    <div className="mx-auto w-full max-w-narrow overflow-hidden rounded-lg border border-hairline bg-surface text-center shadow-ticket">
      <div className="px-6 pt-8 pb-6">
        <p className="text-label font-medium text-ink-muted">Código de error</p>
        <p className="mt-1 font-mono text-ticket font-bold text-brand">404</p>
      </div>

      <div aria-hidden="true" className="relative border-t border-dashed border-border-input">
        <span className={`${CLASES_MUESCA} -left-3`} />
        <span className={`${CLASES_MUESCA} -right-3`} />
      </div>

      <div className="flex flex-col gap-2 p-6">
        <h1 className="text-heading font-semibold text-balance text-ink">
          No encontramos esta página
        </h1>
        <p className="text-body text-ink-secondary">
          Puede que la dirección esté mal escrita o que la página ya no exista.
        </p>
        <Link
          to="/"
          className="mt-4 inline-flex min-h-cta w-full items-center justify-center gap-2 rounded-md bg-primary px-6 py-2 text-body-lg font-semibold text-on-primary shadow-primary transition duration-150 ease-press hover:bg-primary-hover active:translate-y-px active:scale-99 active:bg-primary-active"
        >
          <House aria-hidden="true" className="size-5" />
          Volver al inicio
        </Link>
      </div>
    </div>
  )
}
