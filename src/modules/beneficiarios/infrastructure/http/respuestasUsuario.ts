import { z } from 'zod'

/** Quien registró, aprobó o retiró algo: el backend lo envía como `{ id, nombreCompleto }`. */
export const esquemaUsuarioDto = z.object({ nombreCompleto: z.string() })
