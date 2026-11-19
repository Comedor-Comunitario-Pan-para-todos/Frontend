import { ArrowLeft, BookOpen, CircleCheckBig, RotateCw, WifiOff } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'
import type { GuiaInduccion } from '@/modules/induccion/domain/GuiaInduccion.ts'
import {
  calcularAvance,
  estaLeido,
  primerTemaPendiente,
} from '@/modules/induccion/domain/avanceInduccion.ts'
import { textoDeMinutos, textoDeTemas } from '@/modules/induccion/ui/avance/textos.ts'
import { useGuiaInduccion } from '@/modules/induccion/ui/avance/useGuiaInduccion.ts'
import { Boton } from '@/shared/ui/Boton.tsx'
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
      <p className="text-body-lg font-semibold text-ink">¡Terminaste la inducción!</p>
      <p className="text-body text-ink-secondary">
        Ya puedes empezar tu primer turno. Si lo necesitas, vuelve a leer cualquier tema cuando
        quieras.
      </p>
      <Link to="/" className={CLASES_ENLACE_PRIMARIO}>
        Ir al inicio
      </Link>
    </div>
  )
}

function ContenidoGuia({ guia }: { readonly guia: GuiaInduccion }) {
  const marcar = useMarcarLectura()
  // `undefined`: abrir el tema que toca leer. `null`: el voluntario cerró todos.
  const [seleccion, setSeleccion] = useState<string | null>()

  if (guia.modulos.length === 0) {
    return (
      <AvisoGuia icono={BookOpen} tono="neutro" titulo="Todavía no hay temas">
        La coordinadora aún no ha cargado la guía. Mientras tanto, pídele que te explique lo básico
        antes de empezar.
      </AvisoGuia>
    )
  }

  const avance = calcularAvance(guia)
  const abierto = seleccion === undefined ? (primerTemaPendiente(guia)?.id ?? null) : seleccion
  const fallido = marcar.isError ? marcar.variables : undefined

  function marcarTema(idModulo: string, leido: boolean) {
    // El tema queda abierto mientras se guarda: si falla, el aviso se ve ahí mismo.
    setSeleccion(idModulo)
    marcar.mutate(
      { idModulo, leido },
      {
        // Ya guardado, se pasa solo al siguiente tema que falta.
        onSuccess: () => {
          if (leido) setSeleccion(undefined)
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
          Lee cada tema y marca la casilla al terminar. Si te queda una duda, pregúntale a la
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
            falloAlGuardar={fallido?.idModulo === modulo.id}
            alAlternar={() => setSeleccion(abierto === modulo.id ? null : modulo.id)}
            alMarcar={(leido) => marcarTema(modulo.id, leido)}
            alReintentar={() => fallido && marcarTema(fallido.idModulo, fallido.leido)}
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
            {textoDeTemas(modulos.length)} cortos para tu primer turno · unos{' '}
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
          Revisa tu conexión a internet e inténtalo otra vez.
        </AvisoGuia>
      )}

      {guia.data && <ContenidoGuia guia={guia.data} />}
    </div>
  )
}
