import { ShieldCheck } from 'lucide-react'
import { useFormContext } from 'react-hook-form'
import { useAuth } from '@/modules/auth/index.ts'
import { CasillaVerificacion } from '@/shared/ui/CasillaVerificacion.tsx'
import { PoliticaTratamiento } from './PoliticaTratamiento.tsx'
import { POLITICA_VIGENTE } from '@/modules/beneficiarios/domain/politicaVigente.ts'

interface SeccionAutorizacionProps {
  /** Por un menor de edad autoriza el adulto que lo acompaña (Decreto 1377). */
  readonly esMenor?: boolean
  readonly className?: string
}

const CASILLA = {
  adulto: {
    etiqueta: 'Informé a la persona',
    descripcion: 'Le expliqué la política de datos y estuvo de acuerdo.',
  },
  menor: {
    etiqueta: 'Informé al adulto que lo acompaña',
    descripcion:
      'Por ser menor de edad, le expliqué la política de datos a su madre, padre o acudiente, y estuvo de acuerdo.',
  },
}

/** Va dentro de un `FormProvider` cuyo formulario tiene el campo `informado`. */
export function SeccionAutorizacion({ esMenor = false, className = '' }: SeccionAutorizacionProps) {
  const { usuario } = useAuth()
  const {
    register,
    formState: { errors },
  } = useFormContext<{ informado: boolean }>()

  return (
    <section aria-labelledby="titulo-autorizacion" className={className}>
      <div className="flex items-center gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-sm bg-privacy-soft text-privacy">
          <ShieldCheck aria-hidden="true" className="size-5" />
        </span>
        <div>
          <h2 id="titulo-autorizacion" className="text-body-lg font-semibold text-ink">
            Autorización de datos
          </h2>
          <p className="text-label text-ink-secondary">Ley 1581 de 2012</p>
        </div>
      </div>
      <PoliticaTratamiento politica={POLITICA_VIGENTE} />
      <CasillaVerificacion
        {...CASILLA[esMenor ? 'menor' : 'adulto']}
        error={errors.informado?.message}
        {...register('informado')}
      />
      {usuario && (
        <p className="rounded-sm bg-surface-subtle px-3 py-2 font-mono text-label text-ink-secondary">
          Registra: {usuario.nombreCompleto}
        </p>
      )}
    </section>
  )
}
