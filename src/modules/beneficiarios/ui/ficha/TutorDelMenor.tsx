import { UserRound, UserRoundCheck, UserRoundPlus } from 'lucide-react'
import { Link } from 'react-router'
import { usePermiso } from '@/modules/auth/index.ts'
import type { AutorizacionTutor } from '@/modules/beneficiarios/domain/AutorizacionTutor.ts'
import type { Beneficiario } from '@/modules/beneficiarios/domain/Beneficiario.ts'
import { formatearNumeroDocumento, siglaVisible } from '@/modules/beneficiarios/domain/documento.ts'
import { etiquetaParentesco } from '@/modules/beneficiarios/domain/parentesco.ts'
import { Dato } from './Dato.tsx'
import { DatoReservado } from './DatoReservado.tsx'
import { FilaAutorizacion, type EstadoDeAutorizacion } from './FilaAutorizacion.tsx'
import { LineaDeAuditoria } from './LineaDeAuditoria.tsx'
import { RevocarTutor } from './RevocarTutor.tsx'

const APROBADO: EstadoDeAutorizacion = { texto: 'Aprobado', icono: UserRoundCheck, tono: 'exito' }
const SIN_APROBAR: EstadoDeAutorizacion = { texto: 'Sin aprobar', icono: UserRound, tono: 'neutro' }

interface TutorDelMenorProps {
  readonly beneficiario: Beneficiario
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
    </dl>
  )
}

/** Quién firmó por el menor la autorización de su imagen (RF-21). Solo va en la ficha de un menor. */
export function TutorDelMenor({ beneficiario }: TutorDelMenorProps) {
  const puedeGestionar = usePermiso('beneficiarios.gestionarTutor')
  const autorizacion =
    beneficiario.autorizacionTutor?.estado === 'ACTIVA' ? beneficiario.autorizacionTutor : null

  return (
    <FilaAutorizacion
      titulo="Tutor del menor"
      estado={autorizacion ? APROBADO : SIN_APROBAR}
      detalle={
        autorizacion ? (
          <LineaDeAuditoria
            momento={autorizacion.fechaAprobacion}
            autor={autorizacion.aprobadaPor}
          />
        ) : (
          <p className="text-body text-ink-secondary">
            Su madre, padre, acudiente o tutor legal firma la autorización de sus fotos.{' '}
            {!puedeGestionar && 'Lo aprueba la coordinación.'}
          </p>
        )
      }
      accion={
        !autorizacion &&
        puedeGestionar && (
          <Link
            to={`/beneficiarios/${beneficiario.id}/tutor`}
            className="inline-flex min-h-touch w-full items-center justify-center gap-2 rounded-md bg-primary-soft px-6 py-2 text-body-lg font-semibold text-primary transition duration-150 ease-press hover:text-primary-hover active:translate-y-px active:scale-99"
          >
            <UserRoundPlus aria-hidden="true" className="size-5 shrink-0" />
            Aprobar al tutor
          </Link>
        )
      }
    >
      {autorizacion && (
        <>
          <DatosDelTutor autorizacion={autorizacion} />
          {puedeGestionar && (
            <RevocarTutor beneficiario={beneficiario} nombreTutor={autorizacion.tutor.nombre} />
          )}
        </>
      )}
    </FilaAutorizacion>
  )
}
