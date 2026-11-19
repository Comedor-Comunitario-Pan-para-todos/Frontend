import { erroresDeRango, type RangoFechas } from '@/modules/reportes/domain/RangoFechas.ts'
import { RangoInvalido } from '@/modules/reportes/domain/RangoInvalido.ts'
import type { ResumenExportacion } from '@/modules/reportes/domain/ResumenExportacion.ts'
import type { ExportacionRepository } from './ports/ExportacionRepository.ts'

interface Dependencias {
  readonly repositorio: ExportacionRepository
  /** La fecha de hoy en `AAAA-MM-DD`. */
  readonly hoy: () => string
}

export type ConsultarResumenExportacion = (
  rango: RangoFechas,
  signal?: AbortSignal,
) => Promise<ResumenExportacion>

/** Lanza `RangoInvalido` si el rango no se puede usar, para no preguntarle al servidor por él. */
export function asegurarRangoValido(rango: RangoFechas, hoy: string): void {
  const errores = erroresDeRango(rango, hoy)
  if (errores.desde !== undefined || errores.hasta !== undefined) {
    throw new RangoInvalido(rango, errores)
  }
}

export function crearConsultarResumenExportacion({
  repositorio,
  hoy,
}: Dependencias): ConsultarResumenExportacion {
  return async (rango, signal) => {
    asegurarRangoValido(rango, hoy())
    return repositorio.consultarResumen(rango, signal)
  }
}
