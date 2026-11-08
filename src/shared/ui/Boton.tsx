import { LoaderCircle } from 'lucide-react'
import type { ComponentProps } from 'react'

type VarianteBoton = 'primario' | 'secundario'

interface BotonProps extends ComponentProps<'button'> {
  readonly variante?: VarianteBoton
  readonly cargando?: boolean
}

const CLASES_BASE =
  'inline-flex items-center justify-center gap-2 rounded-md px-6 py-2 text-body-lg font-semibold transition duration-150 ease-press enabled:active:translate-y-px enabled:active:scale-99'

const CLASES_VARIANTE: Record<VarianteBoton, string> = {
  primario:
    'min-h-cta bg-primary text-on-primary shadow-primary enabled:hover:bg-primary-hover enabled:active:bg-primary-active',
  secundario:
    'min-h-touch border border-border-input bg-surface text-ink enabled:hover:bg-surface-hover',
}

export function Boton({
  variante = 'primario',
  cargando = false,
  disabled = false,
  type = 'button',
  className = '',
  children,
  ...resto
}: BotonProps) {
  // Mientras carga conserva el contraste completo: solo se atenúa si está deshabilitado.
  const atenuado = disabled && !cargando ? 'opacity-60' : ''

  return (
    <button
      {...resto}
      type={type}
      disabled={disabled || cargando}
      aria-busy={cargando || undefined}
      className={`${CLASES_BASE} ${CLASES_VARIANTE[variante]} ${atenuado} ${className}`}
    >
      {cargando && <LoaderCircle aria-hidden="true" className="size-5 animate-spin" />}
      {children}
    </button>
  )
}
