import { ChevronRight, LoaderCircle } from 'lucide-react'
import {
  DocumentoBeneficiario,
  iniciales,
  nombreCompleto,
  type Beneficiario,
  type Padron,
} from '@/modules/beneficiarios/index.ts'
import type { Turno } from '@/modules/turnos/domain/Turno.ts'
import { formatearNumeroTurno, turnoDeLaPersona } from '@/modules/turnos/domain/turnosDelDia.ts'
import { Alerta } from '@/shared/ui/Alerta.tsx'
import { Boton } from '@/shared/ui/Boton.tsx'
import { mensajeDeError } from '@/shared/ui/mensajeDeError.ts'

interface ResultadosBusquedaProps {
  readonly padron: Padron
  readonly turnosDeHoy: readonly Turno[]
  readonly alElegir: (beneficiario: Beneficiario) => void
}

function describir({ estado, buscando, total, textoBuscado }: Padron): string {
  if (estado === 'cargando' || buscando) return 'Buscando…'
  if (total === 0) return `No encontramos a nadie con «${textoBuscado}».`
  return total === 1 ? '1 persona encontrada' : `${total} personas encontradas`
}

function OpcionPersona({
  beneficiario,
  turno,
  alElegir,
}: {
  readonly beneficiario: Beneficiario
  readonly turno: Turno | null
  readonly alElegir: () => void
}) {
  return (
    <li>
      <button
        type="button"
        onClick={alElegir}
        className="flex min-h-touch w-full items-center gap-3 rounded-lg border border-hairline bg-surface p-3 text-left shadow-card transition duration-150 ease-press hover:bg-surface-hover active:translate-y-px active:scale-99"
      >
        <span
          aria-hidden="true"
          className="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary-soft text-body font-bold text-primary"
        >
          {iniciales(beneficiario)}
        </span>
        <span className="flex min-w-0 flex-1 flex-col items-start gap-0.5">
          <span className="text-body font-semibold wrap-break-word text-ink">
            {nombreCompleto(beneficiario)}
          </span>
          <DocumentoBeneficiario documento={beneficiario.documento} />
          {turno && (
            <span className="text-label font-medium text-danger">
              Ya tiene el turno {formatearNumeroTurno(turno.numero)}
            </span>
          )}
        </span>
        <ChevronRight aria-hidden="true" className="size-5 shrink-0 text-ink-secondary" />
      </button>
    </li>
  )
}

/** Las personas del padrón que coinciden con lo escrito, para elegir a quién darle el turno. */
export function ResultadosBusqueda({ padron, turnosDeHoy, alElegir }: ResultadosBusquedaProps) {
  if (padron.estado === 'error') {
    return (
      <div className="flex flex-col gap-3">
        <Alerta tipo="peligro">{mensajeDeError(padron.error)}</Alerta>
        <Boton variante="secundario" onClick={padron.reintentar}>
          Buscar de nuevo
        </Boton>
      </div>
    )
  }

  const listo = padron.estado === 'listo' && !padron.buscando

  return (
    <div className="flex flex-col gap-3">
      <p role="status" className="inline-flex items-center gap-2 text-body text-ink-secondary">
        {!listo && <LoaderCircle aria-hidden="true" className="size-5 animate-spin" />}
        {describir(padron)}
      </p>

      {padron.beneficiarios.length > 0 && (
        <ul
          aria-label="Personas encontradas"
          aria-busy={!listo || undefined}
          className={`flex flex-col gap-2 transition-opacity duration-150 ${listo ? '' : 'opacity-60'}`}
        >
          {padron.beneficiarios.map((beneficiario) => (
            <OpcionPersona
              key={beneficiario.id}
              beneficiario={beneficiario}
              turno={turnoDeLaPersona(turnosDeHoy, beneficiario.id)}
              alElegir={() => alElegir(beneficiario)}
            />
          ))}
        </ul>
      )}

      {listo && padron.hayMas && (
        <p className="text-body text-ink-secondary">
          Hay más personas con ese dato. Escriba el apellido o el documento para encontrarla.
        </p>
      )}
    </div>
  )
}
