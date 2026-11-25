import { LockKeyhole } from 'lucide-react'
import { FormProvider } from 'react-hook-form'
import { Link } from 'react-router'
import type { Beneficiario } from '@/modules/beneficiarios/domain/Beneficiario.ts'
import { SeccionDatosBasicos } from '@/modules/beneficiarios/ui/datosBasicos/SeccionDatosBasicos.tsx'
import { AvisoDocumentoAjeno } from '@/modules/beneficiarios/ui/datosSensibles/AvisoDocumentoAjeno.tsx'
import { SeccionDatosExtendidos } from '@/modules/beneficiarios/ui/datosSensibles/SeccionDatosExtendidos.tsx'
import { Alerta } from '@/shared/ui/Alerta.tsx'
import { Boton } from '@/shared/ui/Boton.tsx'
import { mensajeDeError } from '@/shared/ui/mensajeDeError.ts'
import { useActualizar } from './useActualizar.ts'

interface FormularioActualizarProps {
  readonly beneficiario: Beneficiario
}

const CLASES_TARJETA =
  'flex flex-col gap-4 rounded-lg border border-hairline bg-surface p-4 shadow-card'

export function FormularioActualizar({ beneficiario }: FormularioActualizarProps) {
  const actualizar = useActualizar(beneficiario)

  return (
    <FormProvider {...actualizar.formulario}>
      <form
        noValidate
        onSubmit={(evento) => void actualizar.enviar(evento)}
        className="flex flex-col gap-4"
      >
        <section aria-label="Datos de la persona" className={CLASES_TARJETA}>
          <SeccionDatosBasicos esMenor={actualizar.esMenor} />
        </section>

        {actualizar.conSensibles && (
          <section aria-labelledby="titulo-sensibles" className={CLASES_TARJETA}>
            <div className="flex items-center gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-sm bg-privacy-soft text-privacy">
                <LockKeyhole aria-hidden="true" className="size-5" />
              </span>
              <div className="min-w-0">
                <h2 id="titulo-sensibles" className="text-body-lg font-semibold text-ink">
                  Datos sensibles
                </h2>
                <p className="text-label text-ink-secondary">Solo los cambia la coordinación</p>
              </div>
            </div>
            <SeccionDatosExtendidos
              avisoDelDocumento={
                (actualizar.documentoRepetido || actualizar.duenoDelDocumento !== null) && (
                  <AvisoDocumentoAjeno dueno={actualizar.duenoDelDocumento} />
                )
              }
            />
          </section>
        )}

        {actualizar.error !== null && !actualizar.documentoRepetido && (
          <Alerta tipo="peligro" titulo="No se pudieron actualizar los datos">
            {mensajeDeError(actualizar.error)} Lo que escribió sigue aquí.
          </Alerta>
        )}

        <div className="flex flex-col gap-2 md:flex-row-reverse md:justify-start">
          <Boton type="submit" cargando={actualizar.enviando} className="w-full md:w-auto">
            Guardar cambios
          </Boton>
          <Link
            to={`/beneficiarios/${beneficiario.id}`}
            className="inline-flex min-h-touch w-full items-center justify-center rounded-md border border-border-input bg-surface px-6 py-2 text-body-lg font-semibold text-ink transition duration-150 ease-press hover:bg-surface-hover active:translate-y-px active:scale-99 md:w-auto"
          >
            Cancelar
          </Link>
        </div>
      </form>
    </FormProvider>
  )
}
