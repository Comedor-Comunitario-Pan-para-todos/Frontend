import { Download } from 'lucide-react'
import { useState } from 'react'
import type { RangoFechas } from '@/modules/reportes/domain/RangoFechas.ts'
import type { ResumenExportacion } from '@/modules/reportes/domain/ResumenExportacion.ts'
import { Alerta } from '@/shared/ui/Alerta.tsx'
import { Boton } from '@/shared/ui/Boton.tsx'
import { CasillaVerificacion } from '@/shared/ui/CasillaVerificacion.tsx'
import { HojaInferior } from '@/shared/ui/HojaInferior.tsx'
import { textoDelRango } from './textos.ts'

interface ConfirmacionDescargaDialogProps {
  readonly abierto: boolean
  readonly rango: RangoFechas
  readonly resumen: ResumenExportacion
  alConfirmar(): void
  alCancelar(): void
}

type ContenidoProps = Omit<ConfirmacionDescargaDialogProps, 'abierto'>

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

function Contenido({ rango, resumen, alConfirmar, alCancelar }: ContenidoProps) {
  // Se monta cada vez que se abre: la casilla siempre empieza sin marcar.
  const [acepto, setAcepto] = useState(false)

  return (
    <>
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
    </>
  )
}

export function ConfirmacionDescargaDialog({ abierto, ...resto }: ConfirmacionDescargaDialogProps) {
  return (
    <HojaInferior abierta={abierto} titulo="Confirmar descarga" alCerrar={resto.alCancelar}>
      <Contenido {...resto} />
    </HojaInferior>
  )
}
