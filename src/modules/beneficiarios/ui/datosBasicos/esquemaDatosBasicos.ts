import { z } from 'zod'
import type { Beneficiario } from '@/modules/beneficiarios/domain/Beneficiario.ts'
import { esMenorDeEdad } from '@/modules/beneficiarios/domain/edad.ts'
import type { DatosBasicos } from '@/modules/beneficiarios/domain/NuevoBeneficiario.ts'
import { fechaDeHoy } from '@/shared/domain/fechaDeHoy.ts'

const MAXIMO_NOMBRE = 100
const MAXIMO_BARRIO = 100
const FECHA_MAS_ANTIGUA = '1900-01-01'

function nombre(vacio: string, largo: string) {
  return z.string().trim().min(1, vacio).max(MAXIMO_NOMBRE, largo)
}

export const camposBasicos = {
  nombres: nombre('Escriba los nombres.', 'Los nombres son demasiado largos.'),
  apellidos: nombre('Escriba los apellidos.', 'Los apellidos son demasiado largos.'),
  fechaNacimiento: z.string().min(1, 'Indique la fecha de nacimiento.'),
  barrio: z.string().trim().max(MAXIMO_BARRIO, 'El nombre del barrio es demasiado largo.'),
}

const esquema = z.object(camposBasicos)

export type CamposBasicos = z.infer<typeof esquema>

export const CAMPOS_BASICOS_INICIALES: CamposBasicos = {
  nombres: '',
  apellidos: '',
  fechaNacimiento: '',
  barrio: '',
}

type MarcarError = (campo: keyof CamposBasicos, mensaje: string) => void

export function validarDatosBasicos(campos: CamposBasicos, marcarError: MarcarError): void {
  if (campos.fechaNacimiento > fechaDeHoy()) {
    marcarError('fechaNacimiento', 'La fecha de nacimiento no puede ser futura.')
  } else if (campos.fechaNacimiento !== '' && campos.fechaNacimiento < FECHA_MAS_ANTIGUA) {
    marcarError('fechaNacimiento', 'Revise el año de nacimiento.')
  }
}

/** Con una fecha a medio escribir o futura no se avisa nada. */
export function esMenorSegunFecha(fechaNacimiento: string): boolean {
  const hoy = fechaDeHoy()
  return fechaNacimiento !== '' && fechaNacimiento <= hoy && esMenorDeEdad(fechaNacimiento, hoy)
}

export function aDatosBasicos(campos: CamposBasicos): DatosBasicos {
  return {
    nombres: campos.nombres,
    apellidos: campos.apellidos,
    fechaNacimiento: campos.fechaNacimiento,
    barrio: campos.barrio,
  }
}

/** Los datos que ya tiene la persona, para empezar a editarlos. */
export function aCamposBasicos(beneficiario: Beneficiario): CamposBasicos {
  return {
    nombres: beneficiario.nombres,
    apellidos: beneficiario.apellidos,
    fechaNacimiento: beneficiario.fechaNacimiento,
    barrio: beneficiario.barrio ?? '',
  }
}
