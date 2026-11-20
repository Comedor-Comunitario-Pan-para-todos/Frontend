import type { Beneficiario } from '@/modules/beneficiarios/domain/Beneficiario.ts'
import {
  estadoUsoImagen,
  type EstadoUsoImagen,
} from '@/modules/beneficiarios/domain/estadoUsoImagen.ts'
import { fechaDeHoy } from '@/shared/domain/fechaDeHoy.ts'
import { AutorizarUsoDeImagen } from './AutorizarUsoDeImagen.tsx'
import { Dato } from './Dato.tsx'
import { formatearFechaYHora } from './formatearFechaYHora.ts'
import { InsigniaUsoImagen } from './InsigniaUsoImagen.tsx'

interface UsoDeImagenProps {
  readonly beneficiario: Beneficiario
  readonly className?: string
}

const EXPLICACION: Record<EstadoUsoImagen, string> = {
  AUTORIZADA: 'Se le pueden tomar fotos para mostrar el trabajo del comedor.',
  NO_AUTORIZADA:
    'No se le toman fotos en las que se le reconozca. Explíquele la política de imagen y, si está de acuerdo, registre su autorización.',
  REQUIERE_TUTOR:
    'Es menor de edad. Para tomarle fotos se necesita la autorización de su madre, padre o tutor.',
}

export function UsoDeImagen({ beneficiario, className = '' }: UsoDeImagenProps) {
  const estado = estadoUsoImagen(beneficiario, fechaDeHoy())
  const autorizacion = beneficiario.consentimientoImagen

  return (
    <section aria-labelledby="titulo-uso-imagen" className={`flex flex-col gap-3 ${className}`}>
      <h2 id="titulo-uso-imagen" className="text-body-lg font-semibold text-ink">
        Uso de imagen
      </h2>
      <InsigniaUsoImagen estado={estado} />
      <p id="explicacion-uso-imagen" className="text-body text-ink-secondary">
        {EXPLICACION[estado]}
      </p>
      {autorizacion ? (
        <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
          <Dato nombre="Fecha" ancho>
            <span className="font-mono">{formatearFechaYHora(autorizacion.registradoEn)}</span>
          </Dato>
          <Dato nombre="Tomada por">{autorizacion.registradoPor}</Dato>
          <Dato nombre="Política">
            <span className="font-mono">Versión {autorizacion.versionPolitica}</span>
          </Dato>
        </dl>
      ) : (
        <AutorizarUsoDeImagen
          beneficiario={beneficiario}
          requiereTutor={estado === 'REQUIERE_TUTOR'}
          idExplicacion="explicacion-uso-imagen"
        />
      )}
    </section>
  )
}
