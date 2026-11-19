import type { Beneficiario } from '@/modules/beneficiarios/domain/Beneficiario.ts'
import { AutorizacionPendiente } from './AutorizacionPendiente.tsx'
import { AutorizacionRegistrada } from './AutorizacionRegistrada.tsx'

interface AutorizacionDeDatosProps {
  readonly beneficiario: Beneficiario
  readonly className?: string
}

export function AutorizacionDeDatos({ beneficiario, className = '' }: AutorizacionDeDatosProps) {
  return (
    <section aria-labelledby="titulo-autorizacion" className={`flex flex-col gap-3 ${className}`}>
      <h2 id="titulo-autorizacion" className="text-body-lg font-semibold text-ink">
        Autorización de datos
      </h2>
      {beneficiario.consentimiento ? (
        <AutorizacionRegistrada consentimiento={beneficiario.consentimiento} />
      ) : (
        <AutorizacionPendiente beneficiario={beneficiario} />
      )}
    </section>
  )
}
