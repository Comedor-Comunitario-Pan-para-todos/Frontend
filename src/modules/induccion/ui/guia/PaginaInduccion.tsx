import { ArrowLeft, BookOpen, CircleCheckBig, RotateCw, WifiOff } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'
import type { GuiaInduccion, ModuloInduccion } from '@/modules/induccion/domain/GuiaInduccion.ts'
import {
  calcularAvance,
  estaLeido,
  primerTemaPendiente,
} from '@/modules/induccion/domain/avanceInduccion.ts'
import { textoDeMinutos, textoDeTemas } from '@/modules/induccion/ui/avance/textos.ts'
import { useGuiaInduccion } from '@/modules/induccion/ui/avance/useGuiaInduccion.ts'
import { Boton } from '@/shared/ui/Boton.tsx'
import { useConstancia } from '@/shared/ui/constancia/contextoConstancia.ts'
import { AvisoGuia } from './AvisoGuia.tsx'
import { EsperaDeLaGuia } from './EsperaDeLaGuia.tsx'
import { ModuloLecturaCard } from './ModuloLecturaCard.tsx'
import { ProgresoInduccionBar } from './ProgresoInduccionBar.tsx'
import { useMarcarLectura } from './useMarcarLectura.ts'

const CLASES_ENLACE_PRIMARIO =
  'inline-flex min-h-cta w-full items-center justify-center gap-2 rounded-md bg-primary px-6 py-2 text-body-lg font-semibold text-on-primary shadow-primary transition duration-150 ease-press hover:bg-primary-hover active:translate-y-px active:scale-99'

function Felicitacion() {
  return (
    <div
      role="status"
      className="flex flex-col items-center gap-3 rounded-lg border border-success bg-success-soft p-5 text-center"
    >
      <CircleCheckBig aria-hidden="true" className="size-10 text-success" />
      <p className="text-body-lg font-semibold text-ink">¡Terminó la inducción!</p>
      <p className="text-body text-ink-secondary">
        Ya puede empezar su primer turno. Si lo necesita, vuelva a leer cualquier tema cuando
        quiera.
      </p>
      <Link to="/" className={CLASES_ENLACE_PRIMARIO}>
        Ir al inicio
      </Link>
    </div>
  )
}

function ContenidoGuia({ guia }: { readonly guia: GuiaInduccion }) {
  const marcar = useMarcarLectura()
  const constancia = useConstancia()
  // `undefined`: abrir el tema que toca leer. `null`: el voluntario cerró todos.
  const [seleccion, setSeleccion] = useState<string | null>()

  if (guia.modulos.length === 0) {
    return (
      <AvisoGuia icono={BookOpen} tono="neutro" titulo="Todavía no hay temas">
        La coordinadora aún no ha cargado la guía. Mientras tanto, pídale que le explique lo básico
        antes de empezar.
      </AvisoGuia>
    )
  }

  const avance = calcularAvance(guia)
  const abierto = seleccion === undefined ? (primerTemaPendiente(guia)?.id ?? null) : seleccion

  function marcarTema(modulo: ModuloInduccion, leido: boolean) {
    // El tema queda abierto mientras se guarda, para que la persona vea lo que marcó.
    setSeleccion(modulo.id)
    marcar.mutate(
      { idModulo: modulo.id, leido },
      {
        // Ya guardado, se pasa solo al siguiente tema que falta.
        onSuccess: () => {
          if (leido) setSeleccion(undefined)
        },
        onError: () => {
          const estado = leido ? 'sigue sin marcar' : 'sigue marcado como leído'
          constancia.avisarFallo({
            titulo: 'No se guardó la lectura del tema',
            detalle: `«${modulo.titulo}» ${estado}. Revise su conexión e inténtelo de nuevo.`,
            reintentar: () => marcarTema(modulo, leido),
          })
        },
      },
    )
  }

  return (
    <>
      {avance.completa ? (
        <Felicitacion />
      ) : (
        <p className="text-body text-ink-secondary">
          Lea cada tema y marque la casilla al terminar. Si le queda una duda, pregúntele a la
          coordinadora.
        </p>
      )}

      <ProgresoInduccionBar avance={avance} />

      <ol aria-label="Temas de la inducción" className="flex flex-col gap-3">
        {guia.modulos.map((modulo) => (
          <ModuloLecturaCard
            key={modulo.id}
            modulo={modulo}
            leido={estaLeido(guia.progreso, modulo.id)}
            abierto={abierto === modulo.id}
            guardando={marcar.isPending}
            alAlternar={() => setSeleccion(abierto === modulo.id ? null : modulo.id)}
            alMarcar={(leido) => marcarTema(modulo, leido)}
          />
        ))}
      </ol>
    </>
  )
}

/** Guía de inducción para voluntarios nuevos (RF-15). */
export function PaginaInduccion() {
  const guia = useGuiaInduccion()
  const modulos = guia.data?.modulos ?? []
  const minutosTotales = modulos.reduce((suma, modulo) => suma + modulo.minutosLectura, 0)

  return (
    <div className="mx-auto flex w-full max-w-content flex-col gap-4">
      <Link
        to="/"
        className="-ml-2 inline-flex min-h-touch items-center gap-2 self-start rounded-md px-2 text-body font-medium text-ink transition duration-150 ease-press hover:bg-surface-hover"
      >
        <ArrowLeft aria-hidden="true" className="size-5 text-primary" />
        Volver al inicio
      </Link>

      <header className="flex flex-col gap-1">
        <h1 className="text-heading font-semibold text-ink">Guía de inducción</h1>
        {modulos.length > 0 && (
          <p className="text-body text-ink-secondary">
            {textoDeTemas(modulos.length)} cortos para su primer turno · unos{' '}
            {textoDeMinutos(minutosTotales)}
          </p>
        )}
      </header>

      {guia.isPending && (
        <>
          <p role="status" className="sr-only">
            Cargando la guía…
          </p>
          <EsperaDeLaGuia />
        </>
      )}

      {guia.isError && (
        <AvisoGuia
          icono={WifiOff}
          tono="peligro"
          titulo="No pudimos cargar la guía"
          accion={
            <Boton
              variante="secundario"
              cargando={guia.isFetching}
              onClick={() => void guia.refetch()}
              className="w-full"
            >
              {!guia.isFetching && <RotateCw aria-hidden="true" className="size-5" />}
              Reintentar
            </Boton>
          }
        >
          Revise su conexión a internet e inténtelo de nuevo.
        </AvisoGuia>
      )}

      {guia.data && <ContenidoGuia guia={guia.data} />}
    </div>
  )
}
