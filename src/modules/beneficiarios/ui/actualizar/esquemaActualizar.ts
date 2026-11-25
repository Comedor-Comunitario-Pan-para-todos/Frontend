import { z } from 'zod'
import type { ActualizacionDeDatos } from '@/modules/beneficiarios/domain/ActualizacionDeDatos.ts'
import {
  aDatosBasicos,
  camposBasicos,
  validarDatosBasicos,
} from '@/modules/beneficiarios/ui/datosBasicos/esquemaDatosBasicos.ts'

export const esquemaActualizar = z.object(camposBasicos).superRefine((campos, contexto) => {
  validarDatosBasicos(campos, (campo, mensaje) =>
    contexto.addIssue({ code: 'custom', path: [campo], message: mensaje }),
  )
})

export type CamposActualizar = z.infer<typeof esquemaActualizar>

export function aActualizacion(campos: CamposActualizar): ActualizacionDeDatos {
  return { ...aDatosBasicos(campos), sensibles: null }
}
