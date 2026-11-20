import { TriangleAlert } from 'lucide-react'
import { useState } from 'react'
import { nombreCompleto, type Beneficiario } from '@/modules/beneficiarios/domain/Beneficiario.ts'
import { PoliticaTratamiento } from '@/modules/beneficiarios/ui/datosSensibles/PoliticaTratamiento.tsx'
import { useGuardarConsentimiento } from '@/modules/beneficiarios/ui/datosSensibles/useGuardarConsentimiento.ts'
import { Boton } from '@/shared/ui/Boton.tsx'
import { useConstancia } from '@/shared/ui/constancia/contextoConstancia.ts'
import { POLITICA_VIGENTE } from '@/modules/beneficiarios/domain/politicaVigente.ts'

interface AutorizacionPendienteProps {
  readonly beneficiario: Beneficiario
}

/** Para quien se registró sin que quedara guardada su autorización. */
export function AutorizacionPendiente({ beneficiario }: AutorizacionPendienteProps) {
  const guardarConsentimiento = useGuardarConsentimiento()
  const constancia = useConstancia()
  const [guardando, setGuardando] = useState(false)

  async function registrarAutorizacion() {
    const nombre = nombreCompleto(beneficiario)
    setGuardando(true)
    await guardarConsentimiento(beneficiario, () =>
      constancia.confirmar({ titulo: 'Autorización guardada', detalle: nombre, resumen: nombre }),
    )
    setGuardando(false)
  }

  return (
    <>
      <span className="inline-flex items-center gap-1 self-start rounded-pill bg-warning-soft px-3 py-1 text-label font-medium text-warning">
        <TriangleAlert aria-hidden="true" className="size-4 shrink-0" />
        Autorización pendiente
      </span>
      <p className="text-body text-ink-secondary">
        Explíquele la política de datos. Si está de acuerdo, registre su autorización.
      </p>
      <PoliticaTratamiento politica={POLITICA_VIGENTE} />
      <Boton
        cargando={guardando}
        onClick={() => void registrarAutorizacion()}
        className="w-full md:w-auto md:self-end"
      >
        Le expliqué y aceptó
      </Boton>
    </>
  )
}
