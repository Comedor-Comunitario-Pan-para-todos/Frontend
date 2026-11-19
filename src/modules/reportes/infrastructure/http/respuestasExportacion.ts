import { z } from 'zod'

// Contrato propuesto para RF-18 (ver docs/EXPORTACION_PADRON.md).

const cantidad = z.number().int().nonnegative()

export const esquemaResumenExportacion = z.object({
  asistieron: cantidad,
  incluidas: cantidad,
  excluidas: cantidad,
})
