import { CircleAlert, type LucideIcon } from 'lucide-react'
import { useId, type ComponentProps, type ReactNode } from 'react'

interface CampoTextoProps extends ComponentProps<'input'> {
  readonly etiqueta: string
  /** Aclaración corta junto a la etiqueta, como "Obligatorio" u "Opcional". */
  readonly nota?: string
  readonly ayuda?: string
  readonly error?: string
  /** Ícono decorativo al inicio del campo. */
  readonly icono?: LucideIcon
  readonly accion?: ReactNode
}

export function CampoTexto({
  etiqueta,
  nota,
  ayuda,
  error,
  icono: Icono,
  accion,
  id,
  className = '',
  ...resto
}: CampoTextoProps) {
  const idGenerado = useId()
  const idCampo = id ?? idGenerado
  const idNota = `${idCampo}-nota`
  const idDescripcion = `${idCampo}-descripcion`
  const descripcion = error ?? ayuda
  const descritoPor = [nota && idNota, descripcion && idDescripcion].filter(Boolean).join(' ')
  const borde = error ? 'border-danger' : 'border-border-input'

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={idCampo} className="text-label font-medium text-ink">
          {etiqueta}
        </label>
        {nota && (
          <span id={idNota} className="shrink-0 text-label text-ink-muted">
            {nota}
          </span>
        )}
      </div>
      <div className="relative">
        {Icono && (
          <Icono
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-ink-muted"
          />
        )}
        <input
          {...resto}
          id={idCampo}
          aria-invalid={error ? true : undefined}
          aria-describedby={descritoPor || undefined}
          className={`h-touch w-full rounded-md border bg-surface px-4 text-body text-ink placeholder:text-ink-muted disabled:bg-surface-subtle disabled:text-ink-muted ${borde} ${Icono ? 'pl-12' : ''} ${accion ? 'pr-14' : ''} ${className}`}
        />
        {accion}
      </div>
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
