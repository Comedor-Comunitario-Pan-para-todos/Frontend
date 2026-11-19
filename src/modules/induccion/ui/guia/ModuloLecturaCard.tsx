import { Check, ChevronDown, RotateCw, WifiOff } from 'lucide-react'
import { useId } from 'react'
import type { ModuloInduccion } from '@/modules/induccion/domain/GuiaInduccion.ts'
import { CasillaLeido } from './CasillaLeido.tsx'
import { IconoTema } from './IconoTema.tsx'

interface ModuloLecturaCardProps {
  readonly modulo: ModuloInduccion
  readonly leido: boolean
  readonly abierto: boolean
  readonly guardando: boolean
  readonly falloAlGuardar: boolean
  readonly alAlternar: () => void
  readonly alMarcar: (leido: boolean) => void
  readonly alReintentar: () => void
}

function Indicador({ leido, abierto }: Pick<ModuloLecturaCardProps, 'leido' | 'abierto'>) {
  if (abierto) {
    return <ChevronDown aria-hidden="true" className="size-6 shrink-0 rotate-180 text-ink-muted" />
  }
  return leido ? (
    <span aria-hidden="true" className="flex size-7 shrink-0 rounded-sm bg-success">
      <Check className="m-auto size-5 text-on-primary" />
    </span>
  ) : (
    <span
      aria-hidden="true"
      className="size-7 shrink-0 rounded-sm border-2 border-border-input bg-surface"
    />
  )
}

/** Un tema de la guía: cerrado muestra si ya se leyó; abierto, sus puntos y la casilla. */
export function ModuloLecturaCard({
  modulo,
  leido,
  abierto,
  guardando,
  falloAlGuardar,
  alAlternar,
  alMarcar,
  alReintentar,
}: ModuloLecturaCardProps) {
  const idContenido = useId()
  const borde = abierto ? 'border-2 border-primary' : 'border border-hairline'

  return (
    <li className={`rounded-lg bg-surface shadow-card ${borde}`}>
      <h2>
        <button
          type="button"
          aria-expanded={abierto}
          aria-controls={idContenido}
          onClick={alAlternar}
          className="flex min-h-touch w-full items-center gap-3 rounded-lg p-4 text-left"
        >
          <span className="flex size-11 shrink-0 rounded-sm bg-primary-soft">
            <IconoTema idModulo={modulo.id} className="m-auto size-6 text-primary" />
          </span>
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="text-body font-semibold text-ink">
              {modulo.orden}. {modulo.titulo}
            </span>
            {leido ? (
              <span className="text-caption font-medium text-success">Leído</span>
            ) : (
              <span className="text-caption text-ink-muted">
                {modulo.minutosLectura} min de lectura
              </span>
            )}
          </span>
          <Indicador leido={leido} abierto={abierto} />
        </button>
      </h2>

      {abierto && (
        <div id={idContenido} className="flex flex-col gap-4 px-4 pb-4">
          <ul className="flex flex-col gap-3">
            {modulo.puntos.map((punto) => (
              <li key={punto} className="flex gap-3 text-body text-ink-secondary">
                <span
                  aria-hidden="true"
                  className="mt-2.5 size-1.5 shrink-0 rounded-pill bg-primary"
                />
                {punto}
              </li>
            ))}
          </ul>

          <CasillaLeido marcada={leido} deshabilitada={guardando} alCambiar={alMarcar} />

          {falloAlGuardar && (
            <div
              role="alert"
              className="flex items-start gap-3 rounded-md border border-danger bg-danger-soft p-3"
            >
              <WifiOff aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-danger" />
              <div className="flex min-w-0 flex-col items-start gap-2">
                <p className="text-body font-semibold text-danger">
                  No se guardó lo que marcaste en este tema
                </p>
                <p className="text-label text-ink-secondary">
                  Revisa tu conexión a internet e inténtalo otra vez. Lo que ya habías marcado sigue
                  guardado.
                </p>
                <button
                  type="button"
                  onClick={alReintentar}
                  className="inline-flex min-h-touch items-center gap-2 rounded-md border border-danger bg-surface px-4 text-body font-semibold text-danger transition duration-150 ease-press hover:bg-surface-hover active:translate-y-px"
                >
                  <RotateCw aria-hidden="true" className="size-5" />
                  Reintentar
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </li>
  )
}
