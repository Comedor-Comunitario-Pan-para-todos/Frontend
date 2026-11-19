import type { RangoFechas } from '@/modules/reportes/domain/RangoFechas.ts'
import { asegurarRangoValido } from './consultarResumenExportacion.ts'
import type { DescargaPort } from './ports/DescargaPort.ts'
import type { ExportacionRepository, OpcionesGeneracion } from './ports/ExportacionRepository.ts'

interface Dependencias {
  readonly repositorio: ExportacionRepository
  readonly descarga: DescargaPort
  /** La fecha de hoy en `AAAA-MM-DD`. */
  readonly hoy: () => string
}

export interface SolicitudExportacion extends OpcionesGeneracion {
  readonly rango: RangoFechas
  /**
   * La coordinadora aceptó ser responsable del archivo (RNF-08). Es `true` y nada más: sin
   * esa aceptación no hay forma de pedir el padrón.
   */
  readonly responsabilidadAceptada: true
}

export interface PadronExportado {
  readonly nombre: string
}

export type ExportarPadron = (solicitud: SolicitudExportacion) => Promise<PadronExportado>

/** Genera el padrón del rango en el servidor y lo descarga en el dispositivo. */
export function crearExportarPadron({ repositorio, descarga, hoy }: Dependencias): ExportarPadron {
  return async ({ rango, signal, alAvanzar }) => {
    asegurarRangoValido(rango, hoy())
    const archivo = await repositorio.generarPadron(rango, { signal, alAvanzar })
    descarga.guardar(archivo)
    return { nombre: archivo.nombre }
  }
}
