import { z } from 'zod'
import type { ActualizacionDeDatos } from '@/modules/beneficiarios/domain/ActualizacionDeDatos.ts'
import type { Beneficiario } from '@/modules/beneficiarios/domain/Beneficiario.ts'
import {
  aCamposBasicos,
  aDatosBasicos,
  camposBasicos,
  validarDatosBasicos,
} from '@/modules/beneficiarios/ui/datosBasicos/esquemaDatosBasicos.ts'
import {
  aCamposExtendidos,
  aDatosExtendidos,
  camposExtendidos,
  validarDatosExtendidos,
} from '@/modules/beneficiarios/ui/datosSensibles/esquemaDatosExtendidos.ts'

const campos = z.object({ ...camposBasicos, ...camposExtendidos })

export type CamposActualizar = z.infer<typeof campos>

/** `conSensibles` es si quien actualiza puede cambiar documento, teléfono y clasificación. */
export function crearEsquemaActualizar(conSensibles: boolean) {
  return campos.superRefine((valores, contexto) => {
    function marcarError(campo: keyof CamposActualizar, mensaje: string) {
      contexto.addIssue({ code: 'custom', path: [campo], message: mensaje })
    }

    validarDatosBasicos(valores, marcarError)
    if (conSensibles) validarDatosExtendidos(valores, marcarError)
  })
}

export function aCamposActualizar(beneficiario: Beneficiario): CamposActualizar {
  return { ...aCamposBasicos(beneficiario), ...aCamposExtendidos(beneficiario) }
}

export function aActualizacion(
  valores: CamposActualizar,
  conSensibles: boolean,
): ActualizacionDeDatos {
  return {
    ...aDatosBasicos(valores),
    sensibles: conSensibles ? aDatosExtendidos(valores) : null,
  }
}
