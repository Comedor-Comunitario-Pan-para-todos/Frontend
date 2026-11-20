import { z } from 'zod'
import { NIVELES_CAPTURA } from '@/modules/beneficiarios/domain/nivelCaptura.ts'
import type { NuevoBeneficiario } from '@/modules/beneficiarios/domain/NuevoBeneficiario.ts'
import {
  aDatosExtendidos,
  CAMPOS_EXTENDIDOS_INICIALES,
  camposExtendidos,
  validarDatosExtendidos,
} from '@/modules/beneficiarios/ui/datosSensibles/esquemaDatosExtendidos.ts'
import { fechaDeHoy } from '@/shared/domain/fechaDeHoy.ts'

// Los mismos límites que valida el backend, para avisar antes de enviar.
const MAXIMO_NOMBRE = 100
const MAXIMO_BARRIO = 100
const FECHA_MAS_ANTIGUA = '1900-01-01'

function nombre(vacio: string, largo: string) {
  return z.string().trim().min(1, vacio).max(MAXIMO_NOMBRE, largo)
}

export const esquemaRegistro = z
  .object({
    nivel: z.enum(NIVELES_CAPTURA),
    nombres: nombre('Escriba los nombres.', 'Los nombres son demasiado largos.'),
    apellidos: nombre('Escriba los apellidos.', 'Los apellidos son demasiado largos.'),
    fechaNacimiento: z.string().min(1, 'Indique la fecha de nacimiento.'),
    barrio: z.string().trim().max(MAXIMO_BARRIO, 'El nombre del barrio es demasiado largo.'),
    ...camposExtendidos,
    informado: z.boolean(),
  })
  .superRefine((campos, contexto) => {
    function marcarError(campo: keyof typeof campos, mensaje: string) {
      contexto.addIssue({ code: 'custom', path: [campo], message: mensaje })
    }

    if (campos.fechaNacimiento > fechaDeHoy()) {
      marcarError('fechaNacimiento', 'La fecha de nacimiento no puede ser futura.')
    } else if (campos.fechaNacimiento !== '' && campos.fechaNacimiento < FECHA_MAS_ANTIGUA) {
      marcarError('fechaNacimiento', 'Revise el año de nacimiento.')
    }

    if (campos.nivel === 'EXTENDIDO') {
      validarDatosExtendidos(campos, marcarError)
    }

    if (!campos.informado) {
      marcarError('informado', 'Confirme que informó a la persona antes de registrarla.')
    }
  })

export type CamposRegistro = z.infer<typeof esquemaRegistro>

export const CAMPOS_INICIALES: CamposRegistro = {
  nivel: 'BASICO',
  nombres: '',
  apellidos: '',
  fechaNacimiento: '',
  barrio: '',
  ...CAMPOS_EXTENDIDOS_INICIALES,
  informado: false,
}

export function aNuevoBeneficiario(campos: CamposRegistro): NuevoBeneficiario {
  const basicos = {
    nombres: campos.nombres,
    apellidos: campos.apellidos,
    fechaNacimiento: campos.fechaNacimiento,
    barrio: campos.barrio,
  }
  if (campos.nivel === 'BASICO') {
    return { ...basicos, nivel: 'BASICO' }
  }
  return { ...basicos, ...aDatosExtendidos(campos), nivel: 'EXTENDIDO' }
}
