import { Check, CircleAlert } from 'lucide-react'
import { useId, type ComponentProps } from 'react'

export interface OpcionSelector {
  readonly valor: string
  /** Texto corto que se ve en el botón, como "CC". */
  readonly etiqueta: string
  /** Nombre completo para lectores de pantalla, como "Cédula de ciudadanía". */
  readonly nombre?: string
}

interface SelectorOpcionesProps extends Omit<
  ComponentProps<'input'>,
  'type' | 'value' | 'defaultValue' | 'checked' | 'defaultChecked'
> {
  readonly etiqueta: string
  readonly opciones: readonly OpcionSelector[]
  /** Opción elegida, cuando el valor lo controla quien usa el componente. */
  readonly value?: string
  /** Opción elegida al inicio, cuando el valor no se controla. */
  readonly defaultValue?: string
  readonly ayuda?: string
  readonly error?: string
}

const CLASES_OPCION =
  'flex min-h-touch flex-1 cursor-pointer items-center justify-center gap-1 rounded-md border border-border-input bg-surface px-2 text-body font-medium text-ink-secondary transition duration-150 ease-press hover:bg-surface-hover active:scale-99 has-checked:border-primary has-checked:bg-primary-soft has-checked:font-semibold has-checked:text-primary has-focus-visible:outline-3 has-focus-visible:outline-offset-2 has-focus-visible:outline-focus has-disabled:cursor-not-allowed has-disabled:bg-surface-subtle has-disabled:text-ink-muted'

/** Pocas opciones excluyentes a un toque: cada una es un botón táctil, no una lista desplegable. */
export function SelectorOpciones({
  etiqueta,
  opciones,
  value,
  defaultValue,
  ayuda,
  error,
  ...resto
}: SelectorOpcionesProps) {
  const idGrupo = useId()
  const idDescripcion = `${idGrupo}-descripcion`
  const descripcion = error ?? ayuda

  return (
    <fieldset
      aria-invalid={error ? true : undefined}
      aria-describedby={descripcion ? idDescripcion : undefined}
      className="flex min-w-0 flex-col gap-1"
    >
      <legend className="mb-1 text-label font-medium text-ink">{etiqueta}</legend>
      <div className="flex gap-2">
        {opciones.map((opcion) => (
          <label key={opcion.valor} className={CLASES_OPCION}>
            <input
              {...resto}
              type="radio"
              value={opcion.valor}
              checked={value === undefined ? undefined : value === opcion.valor}
              defaultChecked={
                defaultValue === undefined ? undefined : defaultValue === opcion.valor
              }
              className="peer sr-only"
            />
            {/* El color no va solo: la opción elegida lleva además el visto. */}
            <Check aria-hidden="true" className="hidden size-4 shrink-0 peer-checked:block" />
            <span aria-hidden={opcion.nombre ? true : undefined}>{opcion.etiqueta}</span>
            {opcion.nombre && <span className="sr-only">{opcion.nombre}</span>}
          </label>
        ))}
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
    </fieldset>
  )
}
