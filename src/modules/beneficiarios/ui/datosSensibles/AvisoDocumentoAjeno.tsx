import type { Beneficiario } from '@/modules/beneficiarios/domain/Beneficiario.ts'
import { TarjetaBeneficiario } from '@/modules/beneficiarios/ui/beneficiario/TarjetaBeneficiario.tsx'
import { Alerta } from '@/shared/ui/Alerta.tsx'

interface AvisoDocumentoAjenoProps {
  /** Quien ya tiene el documento, si se sabe. */
  readonly dueno: Beneficiario | null
}

export function AvisoDocumentoAjeno({ dueno }: AvisoDocumentoAjenoProps) {
  return (
    <div className="flex flex-col gap-2">
      <Alerta tipo="peligro" titulo="Ese documento ya es de otra persona">
        Revise el número. Si es la misma persona, ya tiene ficha en el padrón.
      </Alerta>
      {dueno !== null && <TarjetaBeneficiario beneficiario={dueno} />}
    </div>
  )
}
