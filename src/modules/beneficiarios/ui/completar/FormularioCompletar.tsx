import { LockKeyhole } from 'lucide-react'
import { FormProvider } from 'react-hook-form'
import { Link } from 'react-router'
import { SeccionAutorizacion } from '@/modules/beneficiarios/ui/SeccionAutorizacion.tsx'
import { SeccionDatosExtendidos } from '@/modules/beneficiarios/ui/SeccionDatosExtendidos.tsx'
import { Alerta } from '@/shared/ui/Alerta.tsx'
import { Boton } from '@/shared/ui/Boton.tsx'
import { mensajeDeError } from '@/shared/ui/mensajeDeError.ts'
import { useCompletar } from './useCompletar.ts'

interface FormularioCompletarProps {
  readonly id: string
  readonly nombre: string
}

const CLASES_TARJETA =
  'flex flex-col gap-4 rounded-lg border border-hairline bg-surface p-4 shadow-card'

export function FormularioCompletar({ id, nombre }: FormularioCompletarProps) {
  const completar = useCompletar(id)

  return (
    <FormProvider {...completar.formulario}>
      <form
        noValidate
        onSubmit={(evento) => void completar.enviar(evento)}
        className="flex flex-col gap-4"
      >
        <section aria-labelledby="titulo-sensibles" className={CLASES_TARJETA}>
          <div className="flex items-center gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-sm bg-privacy-soft text-privacy">
              <LockKeyhole aria-hidden="true" className="size-5" />
            </span>
            <div className="min-w-0">
              <h2 id="titulo-sensibles" className="text-body-lg font-semibold text-ink">
                Datos sensibles
              </h2>
              <p className="text-label wrap-break-word text-ink-secondary">{nombre}</p>
            </div>
          </div>
          <SeccionDatosExtendidos />
        </section>

        <SeccionAutorizacion className={CLASES_TARJETA} />

        {completar.documentoRepetido && (
          <Alerta tipo="peligro" titulo="Ese documento ya es de otra persona">
            Revise el número. Si es la misma persona, ya tiene ficha en el padrón.
          </Alerta>
        )}
        {completar.error !== null && !completar.documentoRepetido && (
          <Alerta tipo="peligro" titulo="No se pudieron guardar los datos">
            {mensajeDeError(completar.error)} Lo que escribió sigue aquí.
          </Alerta>
        )}

        <div className="flex flex-col gap-2 md:flex-row-reverse md:justify-start">
          <Boton type="submit" cargando={completar.enviando} className="w-full md:w-auto">
            Guardar datos
          </Boton>
          <Link
            to={`/beneficiarios/${id}`}
            className="inline-flex min-h-touch w-full items-center justify-center rounded-md border border-border-input bg-surface px-6 py-2 text-body-lg font-semibold text-ink transition duration-150 ease-press hover:bg-surface-hover active:translate-y-px active:scale-99 md:w-auto"
          >
            Cancelar
          </Link>
        </div>
      </form>
    </FormProvider>
  )
}
