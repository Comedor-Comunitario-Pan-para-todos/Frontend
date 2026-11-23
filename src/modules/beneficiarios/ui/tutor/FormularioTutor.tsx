import { FileSignature, UserRound } from 'lucide-react'
import { FormProvider } from 'react-hook-form'
import { Link } from 'react-router'
import { useAuth } from '@/modules/auth/index.ts'
import type { Beneficiario } from '@/modules/beneficiarios/domain/Beneficiario.ts'
import { Alerta } from '@/shared/ui/Alerta.tsx'
import { Boton } from '@/shared/ui/Boton.tsx'
import { CasillaVerificacion } from '@/shared/ui/CasillaVerificacion.tsx'
import { mensajeDeError } from '@/shared/ui/mensajeDeError.ts'
import { CampoSoporte } from './CampoSoporte.tsx'
import { CamposDelTutor } from './CamposDelTutor.tsx'
import { useAprobarTutor } from './useAprobarTutor.ts'

interface FormularioTutorProps {
  readonly ficha: Beneficiario
}

const CLASES_TARJETA =
  'flex flex-col gap-4 rounded-lg border border-hairline bg-surface p-4 shadow-card'

export function FormularioTutor({ ficha }: FormularioTutorProps) {
  const { usuario } = useAuth()
  const tutor = useAprobarTutor(ficha)
  const { errors } = tutor.formulario.formState

  return (
    <FormProvider {...tutor.formulario}>
      <form
        noValidate
        onSubmit={(evento) => void tutor.enviar(evento)}
        className="flex flex-col gap-4"
      >
        <section aria-labelledby="titulo-datos-tutor" className={CLASES_TARJETA}>
          <div className="flex items-center gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-sm bg-privacy-soft text-privacy">
              <UserRound aria-hidden="true" className="size-5" />
            </span>
            <h2 id="titulo-datos-tutor" className="text-body-lg font-semibold text-ink">
              Quién firmó
            </h2>
          </div>
          <CamposDelTutor />
        </section>

        <section aria-labelledby="titulo-papel" className={CLASES_TARJETA}>
          <div className="flex items-center gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-sm bg-privacy-soft text-privacy">
              <FileSignature aria-hidden="true" className="size-5" />
            </span>
            <h2 id="titulo-papel" className="text-body-lg font-semibold text-ink">
              Papel firmado
            </h2>
          </div>
          <CampoSoporte
            archivo={tutor.soporte}
            preparando={tutor.preparandoSoporte}
            error={errors.soporte?.message}
            alElegir={tutor.elegirSoporte}
            alQuitar={tutor.quitarSoporte}
          />
          <CasillaVerificacion
            etiqueta="Revisé el papel firmado"
            descripcion="Lo firmó el tutor y autoriza el uso de la imagen del menor."
            error={errors.revisado?.message}
            {...tutor.formulario.register('revisado')}
          />
          {usuario && (
            <p className="rounded-sm bg-surface-subtle px-3 py-2 font-mono text-label text-ink-secondary">
              Aprueba: {usuario.nombreCompleto}
            </p>
          )}
        </section>

        {tutor.error !== null && (
          <Alerta tipo="peligro" titulo="No se pudo aprobar al tutor">
            {mensajeDeError(tutor.error)} Lo que escribió sigue aquí.
          </Alerta>
        )}

        <div className="flex flex-col gap-2 md:flex-row-reverse md:justify-start">
          <Boton
            type="submit"
            cargando={tutor.enviando}
            disabled={tutor.preparandoSoporte}
            className="w-full md:w-auto"
          >
            Aprobar al tutor
          </Boton>
          <Link
            to={`/beneficiarios/${ficha.id}`}
            className="inline-flex min-h-touch w-full items-center justify-center rounded-md border border-border-input bg-surface px-6 py-2 text-body-lg font-semibold text-ink transition duration-150 ease-press hover:bg-surface-hover active:translate-y-px active:scale-99 md:w-auto"
          >
            Cancelar
          </Link>
        </div>
      </form>
    </FormProvider>
  )
}
