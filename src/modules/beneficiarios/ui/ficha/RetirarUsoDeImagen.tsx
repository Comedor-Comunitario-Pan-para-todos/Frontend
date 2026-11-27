import type { Beneficiario } from '@/modules/beneficiarios/domain/Beneficiario.ts'
import { Boton } from '@/shared/ui/Boton.tsx'
import { useRetirarUsoDeImagen } from './useRetirarUsoDeImagen.ts'

interface RetirarUsoDeImagenProps {
  readonly beneficiario: Beneficiario
}

export function RetirarUsoDeImagen({ beneficiario }: RetirarUsoDeImagenProps) {
  const { retirar, retirando } = useRetirarUsoDeImagen()

  return (
    <Boton
      variante="suave"
      cargando={retirando}
      onClick={() => retirar(beneficiario)}
      className="w-full"
    >
      Retirar autorización
    </Boton>
  )
}
