import { z } from 'zod'

// Contrato propuesto para RF-18 en Backend#62.

const cantidad = z.number().int().nonnegative()

export const esquemaResumenExportacion = z.object({
  asistieron: cantidad,
  incluidas: cantidad,
  excluidas: cantidad,
})
