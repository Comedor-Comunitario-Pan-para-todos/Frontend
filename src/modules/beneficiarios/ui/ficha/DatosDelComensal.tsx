import type { ReactNode } from 'react'
import { usePermiso } from '@/modules/auth/index.ts'
import {
  iniciales,
  nombreCompleto,
  type Beneficiario,
} from '@/modules/beneficiarios/domain/Beneficiario.ts'
import { formatearFechaCalendario } from '@/modules/beneficiarios/domain/fechaCalendario.ts'
import { DocumentoBeneficiario } from '@/modules/beneficiarios/ui/beneficiario/DocumentoBeneficiario.tsx'
import { InsigniaMenorDeEdad } from '@/modules/beneficiarios/ui/beneficiario/InsigniaMenorDeEdad.tsx'
import { ClasificacionBeneficiario } from './ClasificacionBeneficiario.tsx'
import { Dato } from './Dato.tsx'
import { DatoReservado } from './DatoReservado.tsx'
import { InsigniaNivel } from './InsigniaNivel.tsx'
import { InsigniaSinAutorizacion } from './InsigniaSinAutorizacion.tsx'

interface DatosDelComensalProps {
  readonly beneficiario: Beneficiario
  readonly className?: string
  readonly children?: ReactNode
}

function formatearMomento(momento: string): string {
  return new Date(momento).toLocaleDateString('es-CO', {
    timeZone: 'America/Bogota',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export function DatosDelComensal({
  beneficiario,
  className = '',
  children,
}: DatosDelComensalProps) {
  const puedeVerSensibles = usePermiso('beneficiarios.verDatosSensibles')
  const { nivel, documento, fechaNacimiento, barrio, telefono, clasificacion, registradoEn } =
    beneficiario

  return (
    <article className={`flex flex-col gap-4 ${className}`}>
      <header className="flex items-start gap-3 md:gap-4">
        <span
          aria-hidden="true"
          className="flex size-14 shrink-0 items-center justify-center rounded-md bg-primary-soft text-title font-bold text-primary"
        >
          {iniciales(beneficiario)}
        </span>
        <div className="flex min-w-0 flex-col gap-2">
          <h1 className="text-heading font-semibold wrap-break-word text-ink">
            {nombreCompleto(beneficiario)}
          </h1>
          <div className="flex flex-wrap gap-2">
            <InsigniaNivel nivel={nivel} />
            <InsigniaMenorDeEdad fechaNacimiento={fechaNacimiento} />
            {!beneficiario.consentimiento && <InsigniaSinAutorizacion />}
          </div>
        </div>
      </header>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
        <Dato nombre="Nacimiento">
          <span className="font-mono">{formatearFechaCalendario(fechaNacimiento)}</span>
        </Dato>
        <Dato nombre="Barrio">{barrio ?? 'Sin registrar'}</Dato>

        {nivel === 'BASICO' ? (
          <Dato nombre="Datos sensibles" ancho>
            No se registraron: la persona está en nivel básico.
          </Dato>
        ) : (
          <>
            <Dato nombre="Documento">
              <DocumentoBeneficiario documento={documento} />
            </Dato>
            <Dato nombre="Teléfono">
              {!puedeVerSensibles ? (
                <DatoReservado />
              ) : telefono ? (
                <span className="font-mono">{telefono}</span>
              ) : (
                'Sin registrar'
              )}
            </Dato>
            <Dato nombre="Clasificación socioeconómica" ancho>
              {!puedeVerSensibles ? (
                <DatoReservado />
              ) : clasificacion ? (
                <ClasificacionBeneficiario clasificacion={clasificacion} />
              ) : (
                'Sin registrar'
              )}
            </Dato>
          </>
        )}

        <Dato nombre="En el padrón desde">
          <span className="font-mono">{formatearMomento(registradoEn)}</span>
        </Dato>
      </dl>
      {children && (
        <div className="flex flex-col gap-2 border-t border-hairline pt-4 md:flex-row-reverse md:justify-start">
          {children}
        </div>
      )}
    </article>
  )
}
