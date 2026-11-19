import { ChevronRight, GraduationCap } from 'lucide-react'
import { useId } from 'react'
import { Link } from 'react-router'
import { calcularAvance } from '@/modules/induccion/domain/avanceInduccion.ts'
import { BarraAvance } from '@/modules/induccion/ui/avance/BarraAvance.tsx'
import { textoDeMinutos, textoDeTemas } from '@/modules/induccion/ui/avance/textos.ts'
import { useGuiaInduccion } from '@/modules/induccion/ui/avance/useGuiaInduccion.ts'

/**
 * Acceso a la guía desde el Inicio mientras falte algún tema. Si la guía no carga, no estorba:
 * simplemente no aparece y el resto del Inicio sigue funcionando.
 */
export function InduccionPendienteCard() {
  const guia = useGuiaInduccion()
  const idTitulo = useId()
  if (!guia.data) return null

  const avance = calcularAvance(guia.data)
  if (avance.total === 0 || avance.completa) return null

  const empezo = avance.leidos > 0
  const faltan = empezo
    ? `Te faltan ${avance.total - avance.leidos} de ${textoDeTemas(avance.total)}`
    : `${textoDeTemas(avance.total)} cortos`

  return (
    <section
      aria-labelledby={idTitulo}
      className="flex flex-col gap-3 rounded-lg border border-primary bg-surface p-4 shadow-card"
    >
      <div className="flex items-center gap-3">
        <span className="flex size-11 shrink-0 rounded-sm bg-primary-soft">
          <GraduationCap aria-hidden="true" className="m-auto size-6 text-primary" />
        </span>
        <div className="flex min-w-0 flex-col">
          <h2 id={idTitulo} className="text-body font-semibold text-ink">
            Tu guía de inducción
          </h2>
          <p className="text-label text-ink-secondary">
            {faltan} · unos {textoDeMinutos(avance.minutosRestantes)}
          </p>
        </div>
      </div>
      <BarraAvance avance={avance} className="h-2" />
      <Link
        to="/induccion"
        className="inline-flex min-h-touch items-center justify-center gap-2 rounded-md bg-primary-soft px-4 text-body font-semibold text-primary transition duration-150 ease-press hover:bg-surface-hover active:translate-y-px"
      >
        {empezo ? 'Continuar la guía' : 'Empezar la guía'}
        <ChevronRight aria-hidden="true" className="size-5" />
      </Link>
    </section>
  )
}
