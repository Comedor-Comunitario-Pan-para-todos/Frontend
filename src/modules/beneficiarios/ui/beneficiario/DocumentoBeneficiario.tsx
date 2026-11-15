import { usePermiso } from '@/modules/auth/index.ts'
import {
  enmascararDocumento,
  formatearNumeroDocumento,
  ultimosDigitos,
  type Documento,
} from '@/modules/beneficiarios/domain/documento.ts'

interface DocumentoBeneficiarioProps {
  readonly documento: Documento | null
}

const CLASES = 'font-mono text-label text-ink-secondary'

/**
 * Único lugar donde se pinta un documento: decide por el rol si se ve completo o solo sus
 * últimos dígitos (RNF-07), para que ninguna pantalla lo muestre de más por descuido.
 */
export function DocumentoBeneficiario({ documento }: DocumentoBeneficiarioProps) {
  const puedeVerlo = usePermiso('beneficiarios.verDatosSensibles')

  if (documento === null) {
    return <span className="text-label text-ink-secondary">Sin documento</span>
  }

  const { tipo, numero } = documento

  if (puedeVerlo) {
    return (
      <span className={CLASES}>
        {tipo} {formatearNumeroDocumento(numero)}
      </span>
    )
  }

  const finalVisible = ultimosDigitos(numero)

  return (
    <span className={CLASES}>
      <span aria-hidden="true">
        {tipo} {enmascararDocumento(numero)}
      </span>
      <span className="sr-only">
        {finalVisible === ''
          ? `${tipo}, número oculto`
          : `${tipo}, número oculto que termina en ${finalVisible}`}
      </span>
    </span>
  )
}
