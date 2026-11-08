import { CircleAlert } from 'lucide-react'
import { useId, type ComponentProps } from 'react'

interface CampoTextoProps extends ComponentProps<'input'> {
  readonly etiqueta: string
  readonly ayuda?: string
  readonly error?: string
}

export function CampoTexto({
  etiqueta,
  ayuda,
  error,
  id,
  className = '',
  ...resto
}: CampoTextoProps) {
  const idGenerado = useId()
  const idCampo = id ?? idGenerado
  const idDescripcion = `${idCampo}-descripcion`
  const descripcion = error ?? ayuda
  const borde = error ? 'border-danger' : 'border-border-input'

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={idCampo} className="text-label font-medium text-ink">
        {etiqueta}
      </label>
      <input
        {...resto}
        id={idCampo}
        aria-invalid={error ? true : undefined}
        aria-describedby={descripcion ? idDescripcion : undefined}
        className={`h-touch w-full rounded-md border bg-surface px-4 text-body text-ink placeholder:text-ink-muted disabled:bg-surface-subtle disabled:text-ink-muted ${borde} ${className}`}
      />
      {error ? (
        <p id={idDescripcion} className="flex items-start gap-1 text-label text-danger">
          <CircleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          {error}
        </p>
      ) : (
        ayuda && (
          <p id={idDescripcion} className="text-label text-ink-muted">
            {ayuda}
          </p>
        )
      )}
    </div>
  )
}
