import { Clock } from 'lucide-react'
import type { Turno } from '@/modules/turnos/domain/Turno.ts'
import { formatearNumeroTurno } from '@/modules/turnos/domain/turnosDelDia.ts'
import { EstadoTurno } from './EstadoTurno.tsx'
import { formatearHora } from './formatearHora.ts'

interface TiqueteTurnoProps {
  readonly turno: Turno
  readonly encabezado: string
}

/** Pase de turno con el número en grande, para decírselo a la persona en la reja. */
export function TiqueteTurno({ turno, encabezado }: TiqueteTurnoProps) {
  const numero = formatearNumeroTurno(turno.numero)

  return (
    <article
      aria-label={`${encabezado}: ${numero}`}
      className="flex flex-col items-center gap-2 rounded-lg border border-hairline bg-surface p-5 text-center shadow-ticket"
    >
      <p className="text-label font-medium text-ink-secondary">{encabezado}</p>
      <p className="font-mono text-ticket font-bold text-ink">{numero}</p>
      <p className="text-body-lg font-semibold wrap-break-word text-ink">
        {turno.beneficiario.nombreCompleto}
      </p>
      <div aria-hidden="true" className="my-1 w-full border-t-2 border-dashed border-hairline" />
      <div className="flex w-full flex-wrap items-center justify-between gap-3">
        <p className="inline-flex items-center gap-2 font-mono text-body text-ink">
          <Clock aria-hidden="true" className="size-5 text-ink-secondary" />
          <span className="sr-only">Entregado a las</span>
          {formatearHora(turno.entregadoEn)}
        </p>
        <EstadoTurno />
      </div>
    </article>
  )
}
