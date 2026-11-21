import { z } from 'zod'
import type { GuiaInduccion, ProgresoInduccion } from '@/modules/induccion/domain/GuiaInduccion.ts'

// Contrato propuesto para RF-15 (Backend#56 solo nombra las rutas).

const esquemaModuloDto = z.object({
  id: z.string().min(1),
  orden: z.number().int(),
  titulo: z.string(),
  minutosLectura: z.number().int().nonnegative(),
  puntos: z.array(z.string()),
})

const esquemaProgresoDto = z.object({
  modulosLeidos: z.array(z.string()),
})

export const esquemaProgreso: z.ZodType<ProgresoInduccion> = esquemaProgresoDto

export const esquemaGuia: z.ZodType<GuiaInduccion> = z.object({
  modulos: z.array(esquemaModuloDto),
  progreso: esquemaProgresoDto,
})
