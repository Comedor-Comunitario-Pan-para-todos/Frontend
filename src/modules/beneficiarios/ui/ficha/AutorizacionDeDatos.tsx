import { ShieldAlert, ShieldCheck } from 'lucide-react'
import type { Beneficiario } from '@/modules/beneficiarios/domain/Beneficiario.ts'
import { AutorizacionPendiente } from './AutorizacionPendiente.tsx'
import { FilaAutorizacion, type EstadoDeAutorizacion } from './FilaAutorizacion.tsx'
import { LineaDeAuditoria } from './LineaDeAuditoria.tsx'

const AUTORIZADO: EstadoDeAutorizacion = { texto: 'Autorizado', icono: ShieldCheck, tono: 'exito' }
const PENDIENTE: EstadoDeAutorizacion = { texto: 'Pendiente', icono: ShieldAlert, tono: 'aviso' }

interface AutorizacionDeDatosProps {
  readonly beneficiario: Beneficiario
}

export function AutorizacionDeDatos({ beneficiario }: AutorizacionDeDatosProps) {
  const { consentimiento } = beneficiario

  return (
    <FilaAutorizacion
      titulo="Uso de datos"
      estado={consentimiento ? AUTORIZADO : PENDIENTE}
      detalle={
        consentimiento && (
          <LineaDeAuditoria
            momento={consentimiento.registradoEn}
            autor={consentimiento.registradoPor}
            versionPolitica={consentimiento.versionPolitica}
          />
        )
      }
      accion={!consentimiento && <AutorizacionPendiente beneficiario={beneficiario} />}
    />
  )
}
