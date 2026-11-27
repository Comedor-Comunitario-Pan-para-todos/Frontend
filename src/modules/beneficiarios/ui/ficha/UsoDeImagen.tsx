import { usePermiso } from '@/modules/auth/index.ts'
import type { Beneficiario } from '@/modules/beneficiarios/domain/Beneficiario.ts'
import { esMenorDeEdad } from '@/modules/beneficiarios/domain/edad.ts'
import {
  estadoUsoImagen,
  vencioAlCumplir18,
} from '@/modules/beneficiarios/domain/estadoUsoImagen.ts'
import { fechaDeHoy } from '@/shared/domain/fechaDeHoy.ts'
import { AutorizarUsoDeImagen } from './AutorizarUsoDeImagen.tsx'
import { FilaAutorizacion } from './FilaAutorizacion.tsx'
import { ESTADO_DE_IMAGEN } from './estadoDeImagen.ts'
import { HistorialDeImagen } from './HistorialDeImagen.tsx'
import { LineaDeAuditoria } from './LineaDeAuditoria.tsx'
import { RetirarUsoDeImagen } from './RetirarUsoDeImagen.tsx'

interface UsoDeImagenProps {
  readonly beneficiario: Beneficiario
}

export function UsoDeImagen({ beneficiario }: UsoDeImagenProps) {
  const puedeGestionarTutor = usePermiso('beneficiarios.gestionarTutor')
  const hoy = fechaDeHoy()
  const estado = estadoUsoImagen(beneficiario, hoy)
  const porElTutor = esMenorDeEdad(beneficiario.fechaNacimiento, hoy) && estado === 'NO_AUTORIZADA'
  const vencida = vencioAlCumplir18(beneficiario, hoy)
  const autorizacion = vencida ? null : beneficiario.consentimientoImagen
  const puedePedirla = estado !== 'REQUIERE_TUTOR' && (!porElTutor || puedeGestionarTutor)
  const aviso = vencida
    ? 'Cumplió 18 años: lo que autorizó su tutor ya no vale. Ahora autoriza la persona.'
    : estado === 'REQUIERE_TUTOR'
      ? 'Primero hay que aprobar a su tutor.'
      : porElTutor && !puedeGestionarTutor
        ? 'La autorización la da su tutor y la registra la coordinación.'
        : null

  return (
    <FilaAutorizacion
      titulo="Uso de imagen"
      estado={ESTADO_DE_IMAGEN[estado]}
      detalle={
        autorizacion ? (
          <LineaDeAuditoria
            momento={autorizacion.registradoEn}
            autor={autorizacion.registradoPor}
            versionPolitica={autorizacion.versionPolitica}
          />
        ) : (
          aviso && <p className="text-body text-ink-secondary">{aviso}</p>
        )
      }
      accion={
        autorizacion ? (
          <RetirarUsoDeImagen beneficiario={beneficiario} />
        ) : (
          puedePedirla && (
            <AutorizarUsoDeImagen beneficiario={beneficiario} porElTutor={porElTutor} />
          )
        )
      }
    >
      <HistorialDeImagen idBeneficiario={beneficiario.id} />
    </FilaAutorizacion>
  )
}
