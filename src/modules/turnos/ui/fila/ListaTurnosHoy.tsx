import { RotateCw, Ticket } from 'lucide-react'
import type { Turno } from '@/modules/turnos/domain/Turno.ts'
import { formatearNumeroTurno } from '@/modules/turnos/domain/turnosDelDia.ts'
import { Alerta } from '@/shared/ui/Alerta.tsx'
import { Boton } from '@/shared/ui/Boton.tsx'
import { EstadoTurno } from './EstadoTurno.tsx'
import { formatearHora } from './formatearHora.ts'
import type { useTurnosDeHoy } from './useTurnosDeHoy.ts'

interface ListaTurnosHoyProps {
  readonly consulta: ReturnType<typeof useTurnosDeHoy>
}

const FILAS_DE_ESPERA = [1, 2, 3]
const CLASES_CAJA = 'overflow-hidden rounded-lg border border-hairline bg-surface'

function FilaTurnoHoy({ turno }: { readonly turno: Turno }) {
  return (
    <li className="flex items-center gap-3 border-b border-hairline px-4 py-2.5 last:border-b-0">
      <span className="flex h-10 w-16 shrink-0 items-center justify-center rounded-sm bg-surface-subtle font-mono text-body font-medium text-ink">
        {formatearNumeroTurno(turno.numero)}
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="text-body font-medium wrap-break-word text-ink">
          {turno.beneficiario.nombreCompleto}
        </span>
        <span className="font-mono text-label text-ink-secondary">
          {formatearHora(turno.entregadoEn)}
        </span>
      </span>
      <EstadoTurno />
    </li>
  )
}

function contarTurnos(cantidad: number): string {
  return cantidad === 1 ? '1 en total' : `${cantidad} en total`
}

/** Los turnos entregados hoy, con el último de primero (ListaTurnosHoy). */
export function ListaTurnosHoy({ consulta }: ListaTurnosHoyProps) {
  const turnos = consulta.data

  return (
    <section aria-labelledby="titulo-turnos-hoy" className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="titulo-turnos-hoy" className="text-title font-semibold text-ink">
          Turnos entregados hoy
        </h2>
        {turnos && <p className="text-label text-ink-secondary">{contarTurnos(turnos.length)}</p>}
      </div>

      {consulta.isPending && (
        <>
          <p role="status" className="sr-only">
            Cargando los turnos de hoy…
          </p>
          <ul aria-hidden="true" className={CLASES_CAJA}>
            {FILAS_DE_ESPERA.map((fila) => (
              <li
                key={fila}
                className="flex animate-pulse items-center gap-3 border-b border-hairline px-4 py-2.5 last:border-b-0"
              >
                <span className="h-10 w-16 rounded-sm bg-surface-subtle" />
                <span className="h-5 flex-1 rounded-sm bg-surface-subtle" />
              </li>
            ))}
          </ul>
        </>
      )}

      {consulta.isError && !turnos && (
        <div className="flex flex-col gap-3">
          <Alerta tipo="peligro" titulo="No pudimos cargar los turnos de hoy">
            Revise su conexión a internet e inténtelo de nuevo.
          </Alerta>
          <Boton
            variante="secundario"
            cargando={consulta.isFetching}
            onClick={() => void consulta.refetch()}
          >
            {!consulta.isFetching && <RotateCw aria-hidden="true" className="size-5" />}
            Reintentar
          </Boton>
        </div>
      )}

      {turnos && turnos.length === 0 && (
        <div className={`${CLASES_CAJA} flex flex-col items-center gap-2 px-4 py-6 text-center`}>
          <Ticket aria-hidden="true" className="size-8 text-ink-muted" />
          <p className="text-body font-semibold text-ink">
            Todavía no se ha entregado ningún turno hoy.
          </p>
          <p className="text-body text-ink-secondary">El primero que entregue será el #001.</p>
        </div>
      )}

      {turnos && turnos.length > 0 && (
        <ul className={CLASES_CAJA}>
          {turnos.map((turno) => (
            <FilaTurnoHoy key={turno.id} turno={turno} />
          ))}
        </ul>
      )}
    </section>
  )
}
