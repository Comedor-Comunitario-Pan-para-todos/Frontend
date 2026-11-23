import { Camera, CircleAlert, FileUp, LoaderCircle } from 'lucide-react'
import { useId, type ChangeEvent } from 'react'
import { VistaPreviaSoporte } from './VistaPreviaSoporte.tsx'

interface CampoSoporteProps {
  readonly archivo: File | null
  /** Mientras se achica la foto recién tomada. */
  readonly preparando?: boolean
  readonly error?: string
  readonly alElegir: (archivo: File) => void
  readonly alQuitar: () => void
}

const CLASES_OPCION =
  'flex min-h-touch flex-1 cursor-pointer items-center justify-center gap-2 rounded-md border border-border-input bg-surface px-4 py-2 text-body-lg font-semibold text-primary transition duration-150 ease-press hover:bg-surface-hover active:translate-y-px active:scale-99 has-focus-visible:outline-3 has-focus-visible:outline-offset-2 has-focus-visible:outline-focus'

/** El papel firmado por el tutor: se le toma una foto con el teléfono o se elige un archivo. */
export function CampoSoporte({
  archivo,
  preparando = false,
  error,
  alElegir,
  alQuitar,
}: CampoSoporteProps) {
  const idGrupo = useId()
  const idDescripcion = `${idGrupo}-descripcion`

  function elegir(evento: ChangeEvent<HTMLInputElement>) {
    const elegido = evento.target.files?.[0]
    // Se limpia para que elegir otra vez el mismo archivo también avise.
    evento.target.value = ''
    if (elegido) alElegir(elegido)
  }

  return (
    <fieldset
      aria-invalid={error ? true : undefined}
      aria-describedby={idDescripcion}
      className="flex min-w-0 flex-col gap-2"
    >
      <legend className="mb-1 text-label font-medium text-ink">Papel firmado por el tutor</legend>

      {preparando ? (
        <p
          role="status"
          className="flex min-h-touch items-center gap-2 rounded-md bg-surface-subtle px-4 text-body text-ink-secondary"
        >
          <LoaderCircle aria-hidden="true" className="size-5 shrink-0 animate-spin" />
          Preparando la foto…
        </p>
      ) : archivo ? (
        <VistaPreviaSoporte archivo={archivo} alQuitar={alQuitar} />
      ) : (
        <div className="flex flex-col gap-2 sm:flex-row">
          <label className={CLASES_OPCION}>
            <Camera aria-hidden="true" className="size-5 shrink-0" />
            Tomar foto
            <input
              type="file"
              accept="image/*"
              capture="environment"
              className="sr-only"
              onChange={elegir}
            />
          </label>
          <label className={CLASES_OPCION}>
            <FileUp aria-hidden="true" className="size-5 shrink-0" />
            Elegir archivo
            <input
              type="file"
              accept="application/pdf,image/jpeg,image/png"
              className="sr-only"
              onChange={elegir}
            />
          </label>
        </div>
      )}

      {error ? (
        <p id={idDescripcion} className="flex items-start gap-1 text-label text-danger">
          <CircleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          {error}
        </p>
      ) : (
        <p id={idDescripcion} className="text-label text-ink-muted">
          Tómele una foto al papel o elija un PDF. Hasta 5 MB.
        </p>
      )}
    </fieldset>
  )
}
