import { FileSpreadsheet, Lock } from 'lucide-react'
import { useId, useState } from 'react'
import { fechaDeHoy } from '@/shared/domain/fechaDeHoy.ts'
import { rangoDeAtajo } from '@/modules/reportes/domain/atajosDeRango.ts'
import {
  erroresDeRango,
  esRangoValido,
  type RangoFechas,
} from '@/modules/reportes/domain/RangoFechas.ts'
import { hayPersonasParaExportar } from '@/modules/reportes/domain/ResumenExportacion.ts'
import { AdvertenciaHabeasDataBanner } from './AdvertenciaHabeasDataBanner.tsx'
import { BotonExportarExcel } from './BotonExportarExcel.tsx'
import { ConfirmacionDescargaDialog } from './ConfirmacionDescargaDialog.tsx'
import { FiltroRango } from './FiltroRango.tsx'
import { ProgresoDescarga } from './ProgresoDescarga.tsx'
import { ResumenConteos } from './ResumenConteos.tsx'
import { useExportarPadron } from './useExportarPadron.ts'
import { useResumenExportacion } from './useResumenExportacion.ts'

/**
 * Padrón de beneficiarios para la Alcaldía (RF-18): quienes asistieron en un rango de fechas y
 * autorizaron el reporte, una fila por persona. Solo el Presidente de la JAC llega a esta tarjeta
 * (HU-22): es quien entrega el archivo a la Alcaldía.
 */
export function ExportarPadron() {
  const idTitulo = useId()
  const [hoy] = useState(() => fechaDeHoy())
  const [rango, setRango] = useState<RangoFechas>(() => rangoDeAtajo('ESTE_MES', hoy))
  const [confirmando, setConfirmando] = useState(false)

  const errores = erroresDeRango(rango, hoy)
  const rangoValido = esRangoValido(rango, hoy)
  const resumen = useResumenExportacion(rango, rangoValido)
  const exportacion = useExportarPadron()

  // Solo se ofrece el archivo con cifras del rango que se ve en pantalla.
  const listo = resumen.estado === 'listo' && !resumen.actualizando ? resumen.resumen : null
  const puedeExportar = listo !== null && hayPersonasParaExportar(listo)

  return (
    <section
      aria-labelledby={idTitulo}
      className="flex flex-col gap-5 rounded-lg border border-hairline bg-surface p-4 shadow-card md:p-6"
    >
      <header className="flex items-center gap-3">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-md bg-success-soft">
          <FileSpreadsheet aria-hidden="true" className="size-6 text-success" />
        </span>
        <div className="flex min-w-0 flex-col">
          <h2 id={idTitulo} className="text-title font-semibold text-ink">
            Padrón de beneficiarios
          </h2>
          <p className="text-label text-ink-muted">
            Formato Alcaldía de Pereira · Secretaría de Desarrollo Social
          </p>
        </div>
      </header>

      <AdvertenciaHabeasDataBanner />

      <FiltroRango
        rango={rango}
        hoy={hoy}
        errores={errores}
        alCambiar={setRango}
        deshabilitado={exportacion.generando}
      />

      <ResumenConteos estado={resumen} />

      <div className="flex flex-col gap-3">
        <BotonExportarExcel
          generando={exportacion.generando}
          deshabilitado={!puedeExportar}
          alPresionar={() => setConfirmando(true)}
        />
        {exportacion.generando && (
          <ProgresoDescarga avance={exportacion.avance} personas={listo?.incluidas ?? 0} />
        )}
        <p className="flex items-center justify-center gap-2 text-label text-ink-muted">
          <Lock aria-hidden="true" className="size-4 shrink-0" />
          Solo el Presidente de la JAC puede generar este archivo.
        </p>
      </div>

      {listo && (
        <ConfirmacionDescargaDialog
          abierto={confirmando}
          rango={rango}
          resumen={listo}
          alCancelar={() => setConfirmando(false)}
          alConfirmar={() => {
            setConfirmando(false)
            exportacion.exportar(rango, listo.incluidas)
          }}
        />
      )}
    </section>
  )
}
