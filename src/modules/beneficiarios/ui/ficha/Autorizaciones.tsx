import { ShieldCheck } from 'lucide-react'
import type { Beneficiario } from '@/modules/beneficiarios/domain/Beneficiario.ts'
import { esMenorDeEdad } from '@/modules/beneficiarios/domain/edad.ts'
import { fechaDeHoy } from '@/shared/domain/fechaDeHoy.ts'
import { AutorizacionDeDatos } from './AutorizacionDeDatos.tsx'
import { TutorDelMenor } from './TutorDelMenor.tsx'
import { UsoDeImagen } from './UsoDeImagen.tsx'

interface AutorizacionesProps {
  readonly beneficiario: Beneficiario
  readonly className?: string
}

export function Autorizaciones({ beneficiario, className = '' }: AutorizacionesProps) {
  const esMenor = esMenorDeEdad(beneficiario.fechaNacimiento, fechaDeHoy())

  return (
    <section aria-labelledby="titulo-autorizaciones" className={`flex flex-col gap-4 ${className}`}>
      <div className="flex items-center justify-between gap-3">
        <h2 id="titulo-autorizaciones" className="text-title font-semibold text-ink">
          Autorizaciones
        </h2>
        <span className="inline-flex shrink-0 items-center gap-1 rounded-sm bg-privacy-soft px-2 py-1 font-mono text-label font-medium text-privacy">
          <ShieldCheck aria-hidden="true" className="size-4" />
          Ley 1581
        </span>
      </div>
      <div className="flex flex-col divide-y divide-hairline">
        <AutorizacionDeDatos beneficiario={beneficiario} />
        {esMenor && <TutorDelMenor beneficiario={beneficiario} />}
        <UsoDeImagen beneficiario={beneficiario} />
      </div>
    </section>
  )
}
