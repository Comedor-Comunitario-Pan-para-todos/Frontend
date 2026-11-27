import { useState } from 'react'
import { nombreCompleto, type Beneficiario } from '@/modules/beneficiarios/domain/Beneficiario.ts'
import { esMenorDeEdad } from '@/modules/beneficiarios/domain/edad.ts'
import { POLITICA_VIGENTE } from '@/modules/beneficiarios/domain/politicaVigente.ts'
import { useGuardarConsentimiento } from '@/modules/beneficiarios/ui/datosSensibles/useGuardarConsentimiento.ts'
import { fechaDeHoy } from '@/shared/domain/fechaDeHoy.ts'
import { useConstancia } from '@/shared/ui/constancia/contextoConstancia.ts'
import { PedirAutorizacion } from './PedirAutorizacion.tsx'

interface AutorizacionPendienteProps {
  readonly beneficiario: Beneficiario
}

export function AutorizacionPendiente({ beneficiario }: AutorizacionPendienteProps) {
  const guardarConsentimiento = useGuardarConsentimiento()
  const constancia = useConstancia()
  const [guardando, setGuardando] = useState(false)
  const esMenor = esMenorDeEdad(beneficiario.fechaNacimiento, fechaDeHoy())

  async function registrarAutorizacion() {
    const nombre = nombreCompleto(beneficiario)
    setGuardando(true)
    await guardarConsentimiento(beneficiario, () =>
      constancia.confirmar({ titulo: 'Autorización guardada', detalle: nombre, resumen: nombre }),
    )
    setGuardando(false)
  }

  return (
    <PedirAutorizacion
      objeto="de datos"
      titulo="Autorización de datos"
      instruccion={
        esMenor
          ? 'Es menor de edad: explíquele la política de datos al adulto que lo acompaña. Si está de acuerdo, registre la autorización.'
          : 'Explíquele la política de datos. Si está de acuerdo, registre su autorización.'
      }
      politica={POLITICA_VIGENTE}
      confirmacion={esMenor ? 'Le expliqué al adulto y aceptó' : 'Le expliqué y aceptó'}
      guardando={guardando}
      alConfirmar={() => void registrarAutorizacion()}
    />
  )
}
