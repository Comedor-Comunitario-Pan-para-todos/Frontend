import { Check } from 'lucide-react'

interface CasillaLeidoProps {
  readonly marcada: boolean
  readonly deshabilitada: boolean
  readonly alCambiar: (marcada: boolean) => void
}

/** La casilla al final de cada tema. Toda la fila es el área táctil (RNF-05). */
export function CasillaLeido({ marcada, deshabilitada, alCambiar }: CasillaLeidoProps) {
  const fondo = marcada ? 'border-success bg-success-soft' : 'border-border-input bg-surface-subtle'

  return (
    <label
      className={`flex min-h-cta cursor-pointer items-center gap-3 rounded-md border px-4 py-2 transition duration-150 ease-press has-disabled:cursor-wait ${fondo}`}
    >
      <span className="relative flex size-7 shrink-0">
        <input
          type="checkbox"
          checked={marcada}
          disabled={deshabilitada}
          onChange={(evento) => alCambiar(evento.target.checked)}
          className="peer size-7 cursor-pointer appearance-none rounded-sm border-2 border-border-input bg-surface transition duration-150 ease-press checked:border-success checked:bg-success disabled:cursor-wait"
        />
        <Check
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 m-auto hidden size-5 text-on-primary peer-checked:block"
        />
      </span>
      <span className={`text-body font-semibold ${marcada ? 'text-success' : 'text-ink'}`}>
        Ya leí este tema
      </span>
    </label>
  )
}
