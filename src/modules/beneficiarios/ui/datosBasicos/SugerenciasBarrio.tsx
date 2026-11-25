import { MapPin } from 'lucide-react'
import { useId } from 'react'
import { sugerirBarrios } from '@/modules/beneficiarios/domain/barrio.ts'

interface SugerenciasBarrioProps {
  readonly escrito: string
  readonly barrios: readonly string[]
  readonly onElegir: (barrio: string) => void
}

const CLASES_SUGERENCIA =
  'inline-flex min-h-touch items-center gap-2 rounded-sm border border-border-input bg-surface px-4 text-body font-medium text-primary transition duration-150 ease-press hover:bg-surface-hover active:translate-y-px active:scale-99'

/** Barrios ya registrados que se parecen a lo escrito, a un toque, para escribirlos siempre igual. */
export function SugerenciasBarrio({ escrito, barrios, onElegir }: SugerenciasBarrioProps) {
  const idTitulo = useId()
  const sugerencias = sugerirBarrios(escrito, barrios)

  return (
    <>
      <p aria-live="polite" className="sr-only">
        {anuncio(sugerencias.length)}
      </p>
      {sugerencias.length > 0 && (
        <div className="flex flex-col gap-2">
          <p id={idTitulo} className="text-label text-ink-secondary">
            ¿Es uno de estos barrios?
          </p>
          <ul aria-labelledby={idTitulo} className="flex flex-wrap gap-2">
            {sugerencias.map((barrio) => (
              <li key={barrio}>
                <button
                  type="button"
                  className={CLASES_SUGERENCIA}
                  onClick={() => onElegir(barrio)}
                >
                  <MapPin aria-hidden="true" className="size-4 shrink-0" />
                  {barrio}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  )
}

function anuncio(cantidad: number): string {
  if (cantidad === 0) return ''
  return cantidad === 1 ? '1 barrio parecido' : `${cantidad} barrios parecidos`
}
