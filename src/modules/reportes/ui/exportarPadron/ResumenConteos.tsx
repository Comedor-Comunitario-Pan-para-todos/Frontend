import { LoaderCircle, OctagonAlert, UserCheck, Users, UserX, type LucideIcon } from 'lucide-react'
import { Boton } from '@/shared/ui/Boton.tsx'
import { mensajeDeError } from '@/shared/ui/mensajeDeError.ts'
import type { EstadoResumen } from './useResumenExportacion.ts'

interface ResumenConteosProps {
  readonly estado: EstadoResumen
}

type Tono = 'neutro' | 'exito' | 'aviso'

const TONOS: Record<Tono, { icono: string; cifra: string }> = {
  neutro: { icono: 'text-ink-secondary', cifra: 'bg-surface text-ink' },
  exito: { icono: 'text-success', cifra: 'bg-success-soft text-success' },
  aviso: { icono: 'text-warning', cifra: 'bg-warning-soft text-warning' },
}

interface FilaProps {
  readonly Icono: LucideIcon
  readonly tono: Tono
  readonly etiqueta: string
  readonly cantidad: number
}

function Fila({ Icono, tono, etiqueta, cantidad }: FilaProps) {
  const estilo = TONOS[tono]
  return (
    <div className="flex items-center gap-3 py-2">
      <Icono aria-hidden="true" className={`size-5 shrink-0 ${estilo.icono}`} />
      <dt className="min-w-0 flex-1 text-body text-ink">{etiqueta}</dt>
      <dd className={`rounded-pill px-3 py-0.5 font-mono text-label font-medium ${estilo.cifra}`}>
        {cantidad}
      </dd>
    </div>
  )
}

function notaDelResumen(asistieron: number, incluidas: number): string {
  if (asistieron === 0)
    return 'Nadie asistió entre esas fechas. Elija otro rango para generar el archivo.'
  if (incluidas === 0) {
    return 'Nadie de este rango autorizó el reporte a la Alcaldía: no hay datos para el archivo.'
  }
  return 'Una fila por persona, con el número de visitas en el rango.'
}

function Contenido({ estado }: ResumenConteosProps) {
  switch (estado.estado) {
    case 'sin-rango':
      return (
        <p className="text-body text-ink-secondary">
          Corrija las fechas para ver cuántas personas incluye el archivo.
        </p>
      )
    case 'cargando':
      return (
        <p className="flex items-center gap-2 text-body text-ink-secondary">
          <LoaderCircle aria-hidden="true" className="size-5 shrink-0 animate-spin" />
          Contando a las personas del rango…
        </p>
      )
    case 'error':
      return (
        <div role="alert" className="flex flex-col gap-3">
          <p className="flex items-start gap-2 text-body text-danger">
            <OctagonAlert aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
            No se pudo contar a las personas. {mensajeDeError(estado.error)}
          </p>
          <Boton variante="secundario" onClick={estado.reintentar}>
            Reintentar
          </Boton>
        </div>
      )
    case 'listo': {
      const { asistieron, incluidas, excluidas } = estado.resumen
      return (
        <>
          <dl className="flex flex-col divide-y divide-hairline">
            <Fila
              Icono={Users}
              tono="neutro"
              etiqueta="Asistieron en el rango"
              cantidad={asistieron}
            />
            <Fila
              Icono={UserCheck}
              tono="exito"
              etiqueta="Se incluyen en el archivo"
              cantidad={incluidas}
            />
            <Fila
              Icono={UserX}
              tono="aviso"
              etiqueta="Se excluyen: no autorizaron"
              cantidad={excluidas}
            />
          </dl>
          <p className="text-label text-ink-secondary">{notaDelResumen(asistieron, incluidas)}</p>
        </>
      )
    }
  }
}

/** Cuántas personas salen en el archivo y cuántas quedan fuera por no autorizar el reporte. */
export function ResumenConteos({ estado }: ResumenConteosProps) {
  const ocupado = estado.estado === 'cargando' || (estado.estado === 'listo' && estado.actualizando)

  return (
    <section
      aria-label="Personas en el archivo"
      aria-live="polite"
      aria-busy={ocupado || undefined}
      className={`flex flex-col gap-2 rounded-md border border-hairline bg-surface-subtle p-4 transition-opacity duration-150 ease-press ${estado.estado === 'listo' && estado.actualizando ? 'opacity-60' : ''}`}
    >
      <Contenido estado={estado} />
    </section>
  )
}
