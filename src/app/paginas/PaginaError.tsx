import { RotateCw, TriangleAlert } from 'lucide-react'
import { Boton } from '@/shared/ui/Boton.tsx'

export function PaginaError() {
  return (
    <div className="mx-auto flex w-full max-w-narrow flex-col items-center gap-2 rounded-lg border border-hairline bg-surface p-6 text-center shadow-card">
      <TriangleAlert aria-hidden="true" className="size-8 text-danger" />
      <h1 className="text-heading font-semibold text-balance text-ink">
        No pudimos mostrar esta pantalla
      </h1>
      <p className="text-body text-ink-secondary">
        Ocurrió un problema inesperado. Recargue la página y, si continúa, avise a la coordinación.
      </p>
      <Boton className="mt-4 w-full" onClick={() => window.location.reload()}>
        <RotateCw aria-hidden="true" className="size-5" />
        Recargar la página
      </Boton>
    </div>
  )
}
