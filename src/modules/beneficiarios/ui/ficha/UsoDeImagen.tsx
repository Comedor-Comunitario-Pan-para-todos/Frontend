import { usePermiso } from '@/modules/auth/index.ts'
import type { Beneficiario } from '@/modules/beneficiarios/domain/Beneficiario.ts'
import { esMenorDeEdad } from '@/modules/beneficiarios/domain/edad.ts'
import {
  estadoUsoImagen,
  vencioAlCumplir18,
  type EstadoUsoImagen,
} from '@/modules/beneficiarios/domain/estadoUsoImagen.ts'
import { fechaDeHoy } from '@/shared/domain/fechaDeHoy.ts'
import { AutorizarUsoDeImagen } from './AutorizarUsoDeImagen.tsx'
import { Dato } from './Dato.tsx'
import { formatearFechaYHora } from './formatearFechaYHora.ts'
import { HistorialDeImagen } from './HistorialDeImagen.tsx'
import { InsigniaUsoImagen } from './InsigniaUsoImagen.tsx'
import { RetirarUsoDeImagen } from './RetirarUsoDeImagen.tsx'

interface UsoDeImagenProps {
  readonly beneficiario: Beneficiario
  readonly className?: string
}

const EXPLICACION: Record<EstadoUsoImagen, string> = {
  AUTORIZADA: 'Se le pueden tomar fotos para mostrar el trabajo del comedor.',
  NO_AUTORIZADA: 'No se le toman fotos en las que se le reconozca.',
  REQUIERE_TUTOR:
    'Es menor de edad. Para tomarle fotos se necesita la autorización de su madre, padre o tutor.',
}

const EXPLICACION_MENOR_CON_TUTOR = {
  coordinadora: 'No se le toman fotos en las que se le reconozca.',
  otros:
    'No se le toman fotos en las que se le reconozca. La autorización la da su tutor y la registra la coordinación.',
}

const EXPLICACION_AL_CUMPLIR_18 =
  'Cumplió 18 años: la autorización que dio su tutor ya no vale. Ahora necesita la suya.'

export function UsoDeImagen({ beneficiario, className = '' }: UsoDeImagenProps) {
  const puedeGestionarTutor = usePermiso('beneficiarios.gestionarTutor')
  const hoy = fechaDeHoy()
  const estado = estadoUsoImagen(beneficiario, hoy)
  const porElTutor = esMenorDeEdad(beneficiario.fechaNacimiento, hoy) && estado === 'NO_AUTORIZADA'
  const vencida = vencioAlCumplir18(beneficiario, hoy)
  const autorizacion = vencida ? null : beneficiario.consentimientoImagen
  const explicacion = vencida
    ? EXPLICACION_AL_CUMPLIR_18
    : porElTutor
      ? EXPLICACION_MENOR_CON_TUTOR[puedeGestionarTutor ? 'coordinadora' : 'otros']
      : EXPLICACION[estado]

  return (
    <section aria-labelledby="titulo-uso-imagen" className={`flex flex-col gap-3 ${className}`}>
      <h2 id="titulo-uso-imagen" className="text-body-lg font-semibold text-ink">
        Uso de imagen
      </h2>
      <InsigniaUsoImagen estado={estado} />
      <p className="text-body text-ink-secondary">{explicacion}</p>
      {autorizacion ? (
        <>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
            <Dato nombre="Fecha" ancho>
              <span className="font-mono">{formatearFechaYHora(autorizacion.registradoEn)}</span>
            </Dato>
            <Dato nombre="Tomada por">{autorizacion.registradoPor}</Dato>
            <Dato nombre="Política">
              <span className="font-mono">Versión {autorizacion.versionPolitica}</span>
            </Dato>
          </dl>
          <RetirarUsoDeImagen beneficiario={beneficiario} />
        </>
      ) : (
        estado !== 'REQUIERE_TUTOR' &&
        (!porElTutor || puedeGestionarTutor) && (
          <AutorizarUsoDeImagen beneficiario={beneficiario} porElTutor={porElTutor} />
        )
      )}
      <HistorialDeImagen idBeneficiario={beneficiario.id} />
    </section>
  )
}
