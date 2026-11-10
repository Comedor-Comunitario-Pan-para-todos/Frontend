import { ChevronRight, MapPin } from 'lucide-react'
import { Link } from 'react-router'
import {
  iniciales,
  nombreCompleto,
  type Beneficiario,
} from '@/modules/beneficiarios/domain/Beneficiario.ts'
import { DocumentoBeneficiario } from './DocumentoBeneficiario.tsx'

interface TarjetaBeneficiarioProps {
  readonly beneficiario: Beneficiario
}

export function TarjetaBeneficiario({ beneficiario }: TarjetaBeneficiarioProps) {
  const { documento, barrio } = beneficiario

  return (
    <Link
      to={`/beneficiarios/${beneficiario.id}`}
      className="group block h-full rounded-lg transition duration-150 ease-press active:translate-y-px active:scale-99"
    >
      <article className="flex h-full items-start gap-3 rounded-lg border border-hairline bg-surface p-4 shadow-card group-hover:bg-surface-hover">
        <span
          aria-hidden="true"
          className="flex size-12 shrink-0 items-center justify-center rounded-md bg-primary-soft text-body-lg font-bold text-primary"
        >
          {iniciales(beneficiario)}
        </span>
        <div className="flex min-w-0 flex-1 flex-col items-start gap-1">
          <h2 className="text-body-lg font-semibold break-words text-ink">
            {nombreCompleto(beneficiario)}
          </h2>
          <DocumentoBeneficiario documento={documento} />
          {barrio && (
            <span className="mt-1 inline-flex max-w-full items-center gap-1 rounded-sm border border-hairline bg-surface-subtle px-3 py-1 text-label font-medium text-ink-secondary">
              <MapPin aria-hidden="true" className="size-4 shrink-0" />
              <span className="sr-only">Barrio:</span>
              <span className="truncate">{barrio}</span>
            </span>
          )}
        </div>
        <ChevronRight aria-hidden="true" className="size-5 shrink-0 self-center text-ink-muted" />
      </article>
    </Link>
  )
}
