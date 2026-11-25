import { z } from 'zod'
import { NIVELES_CAPTURA } from '@/modules/beneficiarios/domain/nivelCaptura.ts'
import type { NuevoBeneficiario } from '@/modules/beneficiarios/domain/NuevoBeneficiario.ts'
import {
  aDatosBasicos,
  CAMPOS_BASICOS_INICIALES,
  camposBasicos,
  validarDatosBasicos,
} from '@/modules/beneficiarios/ui/datosBasicos/esquemaDatosBasicos.ts'
import {
  aDatosExtendidos,
  CAMPOS_EXTENDIDOS_INICIALES,
  camposExtendidos,
  validarDatosExtendidos,
} from '@/modules/beneficiarios/ui/datosSensibles/esquemaDatosExtendidos.ts'

export const esquemaRegistro = z
  .object({
    nivel: z.enum(NIVELES_CAPTURA),
    ...camposBasicos,
    ...camposExtendidos,
    informado: z.boolean(),
  })
  .superRefine((campos, contexto) => {
    function marcarError(campo: keyof typeof campos, mensaje: string) {
      contexto.addIssue({ code: 'custom', path: [campo], message: mensaje })
    }

    validarDatosBasicos(campos, marcarError)

    if (campos.nivel === 'EXTENDIDO') {
      validarDatosExtendidos(campos, marcarError)
    }

    if (!campos.informado) {
      marcarError('informado', 'Marque la casilla después de explicar la política de datos.')
    }
  })

export type CamposRegistro = z.infer<typeof esquemaRegistro>

export const CAMPOS_INICIALES: CamposRegistro = {
  nivel: 'BASICO',
  ...CAMPOS_BASICOS_INICIALES,
  ...CAMPOS_EXTENDIDOS_INICIALES,
  informado: false,
}

export function aNuevoBeneficiario(campos: CamposRegistro): NuevoBeneficiario {
  const basicos = aDatosBasicos(campos)
  if (campos.nivel === 'BASICO') {
    return { ...basicos, nivel: 'BASICO' }
  }
  return { ...basicos, ...aDatosExtendidos(campos), nivel: 'EXTENDIDO' }
}
