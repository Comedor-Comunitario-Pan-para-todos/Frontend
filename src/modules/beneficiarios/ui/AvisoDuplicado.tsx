import type { PosibleDuplicado } from '@/modules/beneficiarios/application/verificarDuplicado.ts'
import { Alerta } from '@/shared/ui/Alerta.tsx'
import { TarjetaBeneficiario } from './TarjetaBeneficiario.tsx'

interface AvisoDuplicadoProps {
  readonly duplicado: PosibleDuplicado
}

const MOTIVOS: Record<PosibleDuplicado['motivo'], string> = {
  documento: 'Ya hay una persona con este documento',
  'nombre-y-fecha': 'Ya hay una persona con este nombre y fecha de nacimiento',
}

/** Muestra a quien ya está en el padrón, para no anotar dos veces a la misma persona. */
export function AvisoDuplicado({ duplicado }: AvisoDuplicadoProps) {
  return (
    <div className="flex flex-col gap-2">
      <Alerta tipo="aviso" titulo={MOTIVOS[duplicado.motivo]}>
        Revise si es la misma antes de registrarla de nuevo. Toque la tarjeta para ver su ficha.
      </Alerta>
      <TarjetaBeneficiario beneficiario={duplicado.beneficiario} />
    </div>
  )
}
