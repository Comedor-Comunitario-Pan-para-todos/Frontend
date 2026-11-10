import { Check, CircleAlert } from 'lucide-react'
import { useId, type ComponentProps } from 'react'

interface CasillaVerificacionProps extends Omit<ComponentProps<'input'>, 'type'> {
  readonly etiqueta: string
  /** Texto de apoyo bajo la etiqueta: qué significa marcar la casilla. */
  readonly descripcion?: string
  readonly error?: string
}

export function CasillaVerificacion({
  etiqueta,
  descripcion,
  error,
  id,
  className = '',
  ...resto
}: CasillaVerificacionProps) {
  const idGenerado = useId()
  const idCasilla = id ?? idGenerado
  const idEtiqueta = `${idCasilla}-etiqueta`
  const idDescripcion = `${idCasilla}-descripcion`
  const idError = `${idCasilla}-error`
  const descritoPor = [descripcion && idDescripcion, error && idError].filter(Boolean).join(' ')
  const borde = error ? 'border-danger' : 'border-border-input'

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {/* Toda la fila es el área táctil: marca la casilla al tocar el texto. */}
      <label htmlFor={idCasilla} className="flex min-h-touch cursor-pointer items-start gap-3 py-2">
        <span className="relative mt-0.5 flex size-6 shrink-0">
          <input
            {...resto}
            id={idCasilla}
            type="checkbox"
            // El nombre es solo la etiqueta: el texto de apoyo ya llega como descripción.
            aria-labelledby={idEtiqueta}
            aria-invalid={error ? true : undefined}
            aria-describedby={descritoPor || undefined}
            className={`peer size-6 cursor-pointer appearance-none rounded-sm border bg-surface transition duration-150 ease-press checked:border-primary checked:bg-primary disabled:cursor-not-allowed disabled:bg-surface-subtle ${borde}`}
          />
          <Check
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 m-auto hidden size-4 text-on-primary peer-checked:block"
          />
        </span>
        <span className="flex min-w-0 flex-col">
          <span id={idEtiqueta} className="text-body font-medium text-ink">
            {etiqueta}
          </span>
          {descripcion && (
            <span id={idDescripcion} className="text-label text-ink-secondary">
              {descripcion}
            </span>
          )}
        </span>
      </label>
      {error && (
        <p id={idError} className="flex items-start gap-1 text-label text-danger">
          <CircleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          {error}
        </p>
      )}
    </div>
  )
}
