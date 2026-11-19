import { textoDePersonas } from './textos.ts'

interface ProgresoDescargaProps {
  /** Entre 0 y 1, o `null` si el servidor no dice cuánto pesa el archivo. */
  readonly avance: number | null
  readonly personas: number
}

const CLASES_BARRA =
  'h-2 w-full appearance-none overflow-hidden rounded-pill bg-surface-subtle [&::-moz-progress-bar]:bg-primary [&::-webkit-progress-bar]:bg-surface-subtle [&::-webkit-progress-value]:rounded-pill [&::-webkit-progress-value]:bg-primary'

/** Avance de la descarga. Sin tamaño conocido, la barra se mueve sin porcentaje. */
export function ProgresoDescarga({ avance, personas }: ProgresoDescargaProps) {
  const porcentaje = avance === null ? null : Math.round(avance * 100)

  return (
    <div className="flex flex-col gap-2">
      <progress
        aria-label="Avance de la descarga"
        max={100}
        // Sin `value` el navegador la muestra como indeterminada.
        value={porcentaje ?? undefined}
        className={CLASES_BARRA}
      />
      <p className="flex items-baseline justify-between gap-3 text-label text-ink-secondary">
        <span>Preparando el archivo de {textoDePersonas(personas)}…</span>
        {porcentaje !== null && <span className="font-mono text-ink">{porcentaje} %</span>}
      </p>
    </div>
  )
}
