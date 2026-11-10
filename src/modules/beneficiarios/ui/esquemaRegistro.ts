import { z } from 'zod'
import type { NuevoBeneficiario } from '@/modules/beneficiarios/domain/Beneficiario.ts'
import {
  normalizarNumeroDocumento,
  TIPOS_DOCUMENTO,
  type TipoDocumento,
} from '@/modules/beneficiarios/domain/documento.ts'

// Los mismos límites que valida el backend, para avisar antes de enviar.
const MAXIMO_NOMBRE = 100
const MAXIMO_DOCUMENTO = 50
const MAXIMO_BARRIO = 100
const FECHA_MAS_ANTIGUA = '1900-01-01'

/** La fecha de hoy en Colombia, sin importar cómo esté configurado el teléfono. */
export function fechaDeHoy(ahora: Date = new Date()): string {
  return ahora.toLocaleDateString('en-CA', { timeZone: 'America/Bogota' })
}

function nombre(vacio: string, largo: string) {
  return z.string().trim().min(1, vacio).max(MAXIMO_NOMBRE, largo)
}

export const esquemaRegistro = z
  .object({
    nombres: nombre('Escriba los nombres.', 'Los nombres son demasiado largos.'),
    apellidos: nombre('Escriba los apellidos.', 'Los apellidos son demasiado largos.'),
    sinDocumento: z.boolean(),
    tipoDocumento: z.string(),
    numeroDocumento: z.string().trim().max(MAXIMO_DOCUMENTO, 'El número es demasiado largo.'),
    fechaNacimiento: z.string().min(1, 'Indique la fecha de nacimiento.'),
    barrio: z.string().trim().max(MAXIMO_BARRIO, 'El nombre del barrio es demasiado largo.'),
    informado: z.boolean(),
  })
  .superRefine((campos, contexto) => {
    function rechazar(campo: keyof typeof campos, mensaje: string) {
      contexto.addIssue({ code: 'custom', path: [campo], message: mensaje })
    }

    if (!campos.sinDocumento) {
      if (!TIPOS_DOCUMENTO.includes(campos.tipoDocumento as TipoDocumento)) {
        rechazar('tipoDocumento', 'Elija el tipo de documento.')
      }
      if (normalizarNumeroDocumento(campos.numeroDocumento) === '') {
        rechazar('numeroDocumento', 'Escriba el número o marque «Sin documento».')
      }
    }

    if (campos.fechaNacimiento > fechaDeHoy()) {
      rechazar('fechaNacimiento', 'La fecha de nacimiento no puede ser futura.')
    } else if (campos.fechaNacimiento !== '' && campos.fechaNacimiento < FECHA_MAS_ANTIGUA) {
      rechazar('fechaNacimiento', 'Revise el año de nacimiento.')
    }

    if (!campos.informado) {
      rechazar('informado', 'Confirme que informó a la persona antes de registrarla.')
    }
  })

export type CamposRegistro = z.infer<typeof esquemaRegistro>

export const CAMPOS_INICIALES: CamposRegistro = {
  nombres: '',
  apellidos: '',
  sinDocumento: false,
  tipoDocumento: 'CC',
  numeroDocumento: '',
  fechaNacimiento: '',
  barrio: '',
  informado: false,
}

export function aNuevoBeneficiario(campos: CamposRegistro): NuevoBeneficiario {
  return {
    nombres: campos.nombres,
    apellidos: campos.apellidos,
    documento: campos.sinDocumento
      ? null
      : { tipo: campos.tipoDocumento, numero: campos.numeroDocumento },
    fechaNacimiento: campos.fechaNacimiento,
    barrio: campos.barrio,
  }
}
