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
      <h2 id="titulo-autorizaciones" className="text-title font-semibold text-ink">
        Autorizaciones
      </h2>
      <div className="flex flex-col divide-y divide-hairline">
        <AutorizacionDeDatos beneficiario={beneficiario} />
        {esMenor && <TutorDelMenor beneficiario={beneficiario} />}
        <UsoDeImagen beneficiario={beneficiario} />
      </div>
    </section>
  )
}
