import { CircleCheck } from 'lucide-react'
import { type ReactNode, useEffect, useMemo, useRef, useState } from 'react'
import { ContextoConstancia, type AccionesConstancia } from './contextoConstancia.ts'
import { TarjetaConstancia, type DatosTarjeta } from './TarjetaConstancia.tsx'

const TIEMPO_COMO_TARJETA_MS = 2600
const PULSO_GUARDADO = 40
const PULSOS_FALLO = [40, 60, 40]

const formatoHora = new Intl.DateTimeFormat('es-CO', { hour: 'numeric', minute: '2-digit' })

interface Constancia extends DatosTarjeta {
  readonly id: number
  readonly resumen?: string
  readonly hora?: string
  readonly reducida: boolean
}

interface ConstanciaProviderProps {
  /** Al cambiar, se retira la tira de la constancia anterior. */
  readonly pantalla: string
  readonly children: ReactNode
}

function vibrar(patron: number | number[]) {
  if ('vibrate' in navigator) navigator.vibrate(patron)
}

export function ConstanciaProvider({ pantalla, children }: ConstanciaProviderProps) {
  const [actual, setActual] = useState<Constancia | null>(null)
  const [pantallaPrevia, setPantallaPrevia] = useState(pantalla)
  const ultimoId = useRef(0)

  const acciones = useMemo<AccionesConstancia>(() => {
    function mostrar(datos: Omit<Constancia, 'id' | 'reducida'>) {
      ultimoId.current += 1
      setActual({ ...datos, id: ultimoId.current, reducida: false })
    }

    return {
      confirmar({ titulo, detalle, resumen }) {
        vibrar(PULSO_GUARDADO)
        mostrar({ tono: 'exito', titulo, detalle, resumen, hora: formatoHora.format(new Date()) })
      },
      avisarFallo({ titulo, detalle, reintentar }) {
        vibrar(PULSOS_FALLO)
        mostrar({
          tono: 'fallo',
          titulo,
          detalle,
          accion: { etiqueta: 'Reintentar', alPresionar: reintentar },
        })
      },
      pedirDecision({ titulo, detalle, accion }) {
        mostrar({ tono: 'decision', titulo, detalle, accion })
      },
      cerrar() {
        setActual(null)
      },
    }
  }, [])

  const idExito = actual?.tono === 'exito' ? actual.id : null

  useEffect(() => {
    if (idExito === null) return
    const temporizador = setTimeout(() => {
      setActual((previa) => (previa?.id === idExito ? { ...previa, reducida: true } : previa))
    }, TIEMPO_COMO_TARJETA_MS)
    return () => clearTimeout(temporizador)
  }, [idExito])

  if (pantalla !== pantallaPrevia) {
    setPantallaPrevia(pantalla)
    if (actual?.reducida) setActual(null)
  }

  return (
    <ContextoConstancia.Provider value={acciones}>
      {children}
      <div
        role="status"
        className="pointer-events-none fixed inset-x-0 bottom-24 z-30 px-gutter lg:inset-x-auto lg:right-8 lg:bottom-8 lg:w-full lg:max-w-narrow lg:px-0"
      >
        {actual !== null &&
          (actual.reducida ? (
            <p
              key="tira"
              className="flex w-full animate-constancia items-center gap-2 rounded-md border border-success bg-success-soft px-4 py-2 text-label font-medium text-success shadow-card"
            >
              <CircleCheck aria-hidden="true" className="size-5 shrink-0" />
              <span className="truncate">
                {actual.hora} · {actual.resumen}
              </span>
            </p>
          ) : (
            <TarjetaConstancia key={actual.id} datos={actual} alCerrar={acciones.cerrar} />
          ))}
      </div>
    </ContextoConstancia.Provider>
  )
}
