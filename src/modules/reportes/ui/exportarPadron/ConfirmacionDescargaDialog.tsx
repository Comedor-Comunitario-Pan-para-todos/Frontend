import { Download, X } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'
import type { RangoFechas } from '@/modules/reportes/domain/RangoFechas.ts'
import type { ResumenExportacion } from '@/modules/reportes/domain/ResumenExportacion.ts'
import { Alerta } from '@/shared/ui/Alerta.tsx'
import { Boton } from '@/shared/ui/Boton.tsx'
import { CasillaVerificacion } from '@/shared/ui/CasillaVerificacion.tsx'
import { textoDelRango } from './textos.ts'

interface ConfirmacionDescargaDialogProps {
  readonly abierto: boolean
  readonly rango: RangoFechas
  readonly resumen: ResumenExportacion
  alConfirmar(): void
  alCancelar(): void
}

interface ContenidoProps extends Omit<ConfirmacionDescargaDialogProps, 'abierto'> {
  readonly idTitulo: string
}

function Dato({ etiqueta, valor, mono }: { etiqueta: string; valor: string; mono?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-3">
      <dt className="text-label text-ink-secondary">{etiqueta}</dt>
      <dd className={`text-right text-body font-medium text-ink ${mono ? 'font-mono' : ''}`}>
        {valor}
      </dd>
    </div>
  )
}

function Contenido({ idTitulo, rango, resumen, alConfirmar, alCancelar }: ContenidoProps) {
  // Se monta cada vez que se abre: la casilla siempre empieza sin marcar.
  const [acepto, setAcepto] = useState(false)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <h2 id={idTitulo} className="pt-3 text-title font-semibold text-ink">
          Confirmar descarga
        </h2>
        <button
          type="button"
          aria-label="Cerrar"
          onClick={alCancelar}
          className="-mr-3 flex size-touch shrink-0 items-center justify-center rounded-md text-ink-secondary transition duration-150 ease-press hover:bg-surface-hover"
        >
          <X aria-hidden="true" className="size-6" />
        </button>
      </div>
      <p className="text-body text-ink-secondary">
        Revise lo que va a descargar antes de continuar.
      </p>

      <dl className="flex flex-col divide-y divide-hairline rounded-md border border-hairline bg-surface-subtle px-4">
        <Dato etiqueta="Asistencia entre" valor={textoDelRango(rango)} mono />
        <Dato etiqueta="Personas incluidas" valor={String(resumen.incluidas)} mono />
        <Dato etiqueta="Excluidas (no autorizaron)" valor={String(resumen.excluidas)} mono />
        <Dato etiqueta="Formato" valor="Excel (.xlsx)" />
      </dl>

      <Alerta tipo="privacidad" titulo="Usted es responsable de este archivo">
        Contiene datos personales. Guárdelo en un lugar seguro, no lo comparta por WhatsApp ni redes
        sociales y úselo solo para el reporte a la Alcaldía.
      </Alerta>

      <CasillaVerificacion
        etiqueta="Entiendo que soy responsable del manejo de estos datos"
        descripcion="La descarga queda registrada con su nombre, la fecha y la hora."
        checked={acepto}
        onChange={(evento) => setAcepto(evento.target.checked)}
      />

      <div className="flex flex-col gap-3 md:flex-row-reverse">
        <Boton disabled={!acepto} onClick={alConfirmar} className="md:flex-1">
          <Download aria-hidden="true" className="size-5 shrink-0" />
          Confirmar y descargar
        </Boton>
        <Boton variante="secundario" onClick={alCancelar} className="md:flex-1">
          Cancelar
        </Boton>
      </div>
      {!acepto && (
        <p className="text-label text-ink-muted">
          «Confirmar y descargar» se activa cuando marque la casilla.
        </p>
      )}
    </div>
  )
}

/**
 * Última revisión antes de bajar datos personales (RNF-08): resume el archivo y pide que la
 * el Presidente de la JAC acepte ser responsable de él. En teléfono es una hoja inferior; desde tablet,
 * una ventana centrada.
 */
export function ConfirmacionDescargaDialog({ abierto, ...resto }: ConfirmacionDescargaDialogProps) {
  const dialogo = useRef<HTMLDialogElement>(null)
  const idTitulo = useId()

  useEffect(() => {
    const elemento = dialogo.current
    if (!elemento) return
    if (abierto && !elemento.open) elemento.showModal()
    if (!abierto && elemento.open) elemento.close()
  }, [abierto])

  return (
    <dialog
      ref={dialogo}
      aria-labelledby={idTitulo}
      // Escape cierra igual que «Cancelar»: el estado lo sigue llevando quien abre la ventana.
      onCancel={(evento) => {
        evento.preventDefault()
        resto.alCancelar()
      }}
      className="mx-0 mt-auto mb-0 w-full max-w-full rounded-t-lg bg-surface px-6 pt-4 pb-safe text-ink shadow-raised backdrop:bg-surface-dark/50 md:m-auto md:max-w-narrow md:rounded-lg md:pb-6"
    >
      {abierto && <Contenido idTitulo={idTitulo} {...resto} />}
    </dialog>
  )
}
