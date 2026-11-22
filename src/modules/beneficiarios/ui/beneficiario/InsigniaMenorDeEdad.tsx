import { ShieldUser } from 'lucide-react'
import { esMenorDeEdad } from '@/modules/beneficiarios/domain/edad.ts'
import { fechaDeHoy } from '@/shared/domain/fechaDeHoy.ts'

interface InsigniaMenorDeEdadProps {
  readonly fechaNacimiento: string
}

/** Marca a la persona menor de 18 años, que tiene protección reforzada (RF-21). */
export function InsigniaMenorDeEdad({ fechaNacimiento }: InsigniaMenorDeEdadProps) {
  if (!esMenorDeEdad(fechaNacimiento, fechaDeHoy())) return null

  return (
    <span className="inline-flex items-center gap-1 self-start rounded-pill bg-privacy-soft px-3 py-1 text-label font-medium text-privacy">
      <ShieldUser aria-hidden="true" className="size-4 shrink-0" />
      Menor de edad
    </span>
  )
}
