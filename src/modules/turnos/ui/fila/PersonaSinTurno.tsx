import { CircleCheck, Ticket } from 'lucide-react'
import {
  DocumentoBeneficiario,
  iniciales,
  nombreCompleto,
  type Beneficiario,
} from '@/modules/beneficiarios/index.ts'
import { Alerta } from '@/shared/ui/Alerta.tsx'
import { Boton } from '@/shared/ui/Boton.tsx'

interface PersonaSinTurnoProps {
  readonly beneficiario: Beneficiario
  /** Ya se sabe que no tiene turno hoy (la lista de hoy cargó y no aparece). */
  readonly confirmadoSinTurno: boolean
  readonly entregando: boolean
  /** El servidor dijo que hoy no se pueden entregar turnos. */
  readonly jornadaNoDisponible: boolean
  readonly alEntregar: () => void
}

/** La persona elegida, todavía sin turno, con el botón para entregárselo. */
export function PersonaSinTurno({
  beneficiario,
  confirmadoSinTurno,
  entregando,
  jornadaNoDisponible,
  alEntregar,
}: PersonaSinTurnoProps) {
  return (
    <>
      <article className="flex items-start gap-3 rounded-lg border border-hairline bg-surface p-4 shadow-card">
        <span
          aria-hidden="true"
          className="flex size-12 shrink-0 items-center justify-center rounded-md bg-primary-soft text-body-lg font-bold text-primary"
        >
          {iniciales(beneficiario)}
        </span>
        <div className="flex min-w-0 flex-1 flex-col items-start gap-1">
          <h2 className="text-body-lg font-semibold wrap-break-word text-ink">
            {nombreCompleto(beneficiario)}
          </h2>
          <DocumentoBeneficiario documento={beneficiario.documento} />
          {confirmadoSinTurno && (
            <span className="mt-1 inline-flex items-center gap-1 rounded-pill bg-success-soft px-3 py-1 text-label font-medium text-success">
              <CircleCheck aria-hidden="true" className="size-4" />
              Sin turno hoy
            </span>
          )}
        </div>
      </article>

      {jornadaNoDisponible ? (
        <Alerta tipo="aviso" titulo="No se pueden entregar turnos ahora">
          La jornada de hoy no está abierta o ya se entregaron todas las raciones. Avísele a la
          coordinadora.
        </Alerta>
      ) : (
        <Boton cargando={entregando} onClick={alEntregar} className="w-full">
          {!entregando && <Ticket aria-hidden="true" className="size-6" />}
          {entregando ? 'Entregando turno…' : 'Entregar turno'}
        </Boton>
      )}
    </>
  )
}
