import { z } from 'zod'
import type { Turno } from '@/modules/turnos/domain/Turno.ts'

// Contrato propuesto para RF-03 (Backend#32 solo nombra las rutas).

const esquemaTurnoDto = z.object({
  id: z.string().min(1),
  numero: z.number().int().positive(),
  beneficiario: z.object({
    id: z.string().min(1),
    nombreCompleto: z.string(),
  }),
  entregadoEn: z.iso.datetime({ offset: true }),
  estado: z.literal('EN_ESPERA'),
})

export const esquemaTurno: z.ZodType<Turno> = esquemaTurnoDto

export const esquemaTurnos: z.ZodType<Turno[]> = z.array(esquemaTurnoDto)
