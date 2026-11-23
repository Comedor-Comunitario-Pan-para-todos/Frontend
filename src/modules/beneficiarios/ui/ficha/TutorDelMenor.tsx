import { UserRoundCheck, UserRoundPlus } from 'lucide-react'
import { Link } from 'react-router'
import { usePermiso } from '@/modules/auth/index.ts'
import type { AutorizacionTutor } from '@/modules/beneficiarios/domain/AutorizacionTutor.ts'
import type { Beneficiario } from '@/modules/beneficiarios/domain/Beneficiario.ts'
import { formatearNumeroDocumento, siglaVisible } from '@/modules/beneficiarios/domain/documento.ts'
import { etiquetaParentesco } from '@/modules/beneficiarios/domain/parentesco.ts'
import { Dato } from './Dato.tsx'
import { DatoReservado } from './DatoReservado.tsx'
import { formatearFechaYHora } from './formatearFechaYHora.ts'

interface TutorDelMenorProps {
  readonly beneficiario: Beneficiario
  readonly className?: string
}

function DatosDelTutor({ autorizacion }: { readonly autorizacion: AutorizacionTutor }) {
  const { nombre, parentesco, tipoDocumento, numeroDocumento, telefono } = autorizacion.tutor

  return (
    <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
      <Dato nombre="Nombre" ancho>
        {nombre}
      </Dato>
      <Dato nombre="Qué es del menor">{etiquetaParentesco(parentesco)}</Dato>
      <Dato nombre="Teléfono">
        {telefono === null ? <DatoReservado /> : <span className="font-mono">{telefono}</span>}
      </Dato>
      <Dato nombre="Documento" ancho>
        {tipoDocumento === null || numeroDocumento === null ? (
          <DatoReservado />
        ) : (
          <span className="font-mono">
            {siglaVisible(tipoDocumento)} {formatearNumeroDocumento(numeroDocumento)}
          </span>
        )}
      </Dato>
      <Dato nombre="Aprobado">
        <span className="font-mono">{formatearFechaYHora(autorizacion.fechaAprobacion)}</span>
      </Dato>
      <Dato nombre="Aprobado por">{autorizacion.aprobadaPor}</Dato>
    </dl>
  )
}

/** Quién firmó por el menor la autorización de su imagen (RF-21). Solo va en la ficha de un menor. */
export function TutorDelMenor({ beneficiario, className = '' }: TutorDelMenorProps) {
  const puedeAprobar = usePermiso('beneficiarios.gestionarTutor')
  const autorizacion =
    beneficiario.autorizacionTutor?.estado === 'ACTIVA' ? beneficiario.autorizacionTutor : null

  return (
    <section aria-labelledby="titulo-tutor" className={`flex flex-col gap-3 ${className}`}>
      <h2 id="titulo-tutor" className="text-body-lg font-semibold text-ink">
        Tutor del menor
      </h2>

      {autorizacion ? (
        <>
          <span className="inline-flex items-center gap-1 self-start rounded-pill bg-success-soft px-3 py-1 text-label font-medium text-success">
            <UserRoundCheck aria-hidden="true" className="size-4 shrink-0" />
            Tutor aprobado
          </span>
          <DatosDelTutor autorizacion={autorizacion} />
        </>
      ) : (
        <>
          <p className="text-body text-ink-secondary">
            Todavía no tiene un tutor aprobado. Su madre, padre, acudiente o tutor legal firma la
            autorización para el uso de su imagen. {!puedeAprobar && 'Lo aprueba la coordinación.'}
          </p>
          {puedeAprobar && (
            <Link
              to={`/beneficiarios/${beneficiario.id}/tutor`}
              className="inline-flex min-h-touch w-full items-center justify-center gap-2 rounded-md border border-border-input bg-surface px-6 py-2 text-body-lg font-semibold text-primary transition duration-150 ease-press hover:bg-surface-hover active:translate-y-px active:scale-99 md:w-auto md:self-end"
            >
              <UserRoundPlus aria-hidden="true" className="size-5 shrink-0" />
              Aprobar al tutor
            </Link>
          )}
        </>
      )}
    </section>
  )
}
