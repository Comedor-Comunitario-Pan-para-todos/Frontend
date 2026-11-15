import { ArrowLeft, ShieldCheck } from 'lucide-react'
import { Link } from 'react-router'
import { FormularioRegistro } from './FormularioRegistro.tsx'
import { useRegistro } from './useRegistro.ts'

export function PaginaRegistro() {
  const registro = useRegistro()

  return (
    <div className="mx-auto flex w-full max-w-content flex-col gap-4">
      <Link
        to="/beneficiarios"
        className="-ml-2 inline-flex min-h-touch items-center gap-2 self-start rounded-md px-2 text-body font-medium text-ink transition duration-150 ease-press hover:bg-surface-hover"
      >
        <ArrowLeft aria-hidden="true" className="size-5 text-primary" />
        Volver al padrón
      </Link>

      <header className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="text-heading font-semibold text-ink">Registrar persona</h1>
          <p className="text-body text-ink-secondary">
            Se anota una sola vez y queda en el padrón del comedor.
          </p>
        </div>
        <span className="mt-1 inline-flex shrink-0 items-center gap-1 rounded-sm bg-privacy-soft px-2 py-1 font-mono text-label font-medium text-privacy">
          <ShieldCheck aria-hidden="true" className="size-4" />
          Ley 1581
        </span>
      </header>

      <FormularioRegistro registro={registro} />
    </div>
  )
}
