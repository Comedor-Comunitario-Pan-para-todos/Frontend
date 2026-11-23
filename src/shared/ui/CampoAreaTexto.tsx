import { CircleAlert } from 'lucide-react'
import { useId, type ComponentProps } from 'react'

interface CampoAreaTextoProps extends ComponentProps<'textarea'> {
  readonly etiqueta: string
  readonly value: string
  readonly maxLength: number
  readonly error?: string
}

/** Texto de varias líneas, con cuántos caracteres van de los que caben. */
export function CampoAreaTexto({
  etiqueta,
  value,
  maxLength,
  error,
  id,
  className = '',
  ...resto
}: CampoAreaTextoProps) {
  const idGenerado = useId()
  const idCampo = id ?? idGenerado
  const idError = `${idCampo}-error`
  const borde = error ? 'border-danger' : 'border-border-input'

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={idCampo} className="text-label font-medium text-ink">
        {etiqueta}
      </label>
      <textarea
        {...resto}
        id={idCampo}
        value={value}
        maxLength={maxLength}
        rows={3}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? idError : undefined}
        className={`min-h-touch w-full resize-y rounded-md border bg-surface px-4 py-3 text-body text-ink placeholder:text-ink-muted ${borde} ${className}`}
      />
      <div className="flex items-start justify-between gap-3">
        {error ? (
          <p id={idError} className="flex items-start gap-1 text-label text-danger">
            <CircleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
            {error}
          </p>
        ) : (
          <span />
        )}
        <span className="shrink-0 font-mono text-label text-ink-muted">
          {value.length}/{maxLength}
        </span>
      </div>
    </div>
  )
}
