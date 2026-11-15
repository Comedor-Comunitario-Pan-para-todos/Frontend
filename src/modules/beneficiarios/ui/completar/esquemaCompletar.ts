import { z } from 'zod'
import {
  CAMPOS_EXTENDIDOS_INICIALES,
  camposExtendidos,
  validarDatosExtendidos,
} from '@/modules/beneficiarios/ui/datosSensibles/esquemaDatosExtendidos.ts'

export const esquemaCompletar = z
  .object({ ...camposExtendidos, informado: z.boolean() })
  .superRefine((campos, contexto) => {
    function marcarError(campo: keyof typeof campos, mensaje: string) {
      contexto.addIssue({ code: 'custom', path: [campo], message: mensaje })
    }

    validarDatosExtendidos(campos, marcarError)

    if (!campos.informado) {
      marcarError('informado', 'Confirme que informó a la persona antes de guardar sus datos.')
    }
  })

export type CamposCompletar = z.infer<typeof esquemaCompletar>

export const CAMPOS_COMPLETAR_INICIALES: CamposCompletar = {
  ...CAMPOS_EXTENDIDOS_INICIALES,
  informado: false,
}
