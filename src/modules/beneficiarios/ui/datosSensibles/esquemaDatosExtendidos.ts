import { z } from 'zod'
import {
  esGrupoClasificacion,
  esSistemaClasificacion,
} from '@/modules/beneficiarios/domain/clasificacionSocioeconomica.ts'
import {
  etiquetaTipoDocumento,
  normalizarNumeroDocumento,
  TIPOS_DOCUMENTO,
  type TipoDocumento,
} from '@/modules/beneficiarios/domain/documento.ts'
import {
  cumpleFormatoDocumento,
  FORMATOS_DOCUMENTO,
} from '@/modules/beneficiarios/domain/formatoDocumento.ts'
import type { DatosExtendidos } from '@/modules/beneficiarios/domain/NuevoBeneficiario.ts'
import { normalizarTelefono } from '@/modules/beneficiarios/domain/telefono.ts'

// Fijo de 7 dígitos o celular de 10.
const TELEFONO_VALIDO = /^\d{7,10}$/

export const camposExtendidos = {
  sinDocumento: z.boolean(),
  tipoDocumento: z.string(),
  numeroDocumento: z.string().trim(),
  telefono: z.string().trim(),
  sistemaClasificacion: z.string(),
  grupoClasificacion: z.string().trim().toUpperCase(),
}

const esquema = z.object(camposExtendidos)

export type CamposExtendidos = z.infer<typeof esquema>

export const CAMPOS_EXTENDIDOS_INICIALES: CamposExtendidos = {
  sinDocumento: false,
  tipoDocumento: 'CC',
  numeroDocumento: '',
  telefono: '',
  sistemaClasificacion: '',
  grupoClasificacion: '',
}

function mensajeDeFormato(tipo: TipoDocumento): string {
  const { soloDigitos, minimo, maximo } = FORMATOS_DOCUMENTO[tipo]
  const nombre = etiquetaTipoDocumento(tipo)
  const unidad = soloDigitos ? 'dígitos' : 'letras o números'
  return `Revise el número: ${nombre.charAt(0).toLowerCase()}${nombre.slice(1)} lleva de ${minimo} a ${maximo} ${unidad}.`
}

type MarcarError = (campo: keyof CamposExtendidos, mensaje: string) => void

export function validarDatosExtendidos(campos: CamposExtendidos, marcarError: MarcarError): void {
  if (!campos.sinDocumento) {
    const tipo = campos.tipoDocumento as TipoDocumento
    const numero = normalizarNumeroDocumento(campos.numeroDocumento)
    if (!TIPOS_DOCUMENTO.includes(tipo)) {
      marcarError('tipoDocumento', 'Elija el tipo de documento.')
    } else if (numero !== '' && !cumpleFormatoDocumento(tipo, numero)) {
      marcarError('numeroDocumento', mensajeDeFormato(tipo))
    }
    if (numero === '') {
      marcarError('numeroDocumento', 'Escriba el número o marque «Sin documento».')
    }
  }
  const telefono = normalizarTelefono(campos.telefono)
  if (telefono !== '' && !TELEFONO_VALIDO.test(telefono)) {
    marcarError('telefono', 'Revise el teléfono: 7 dígitos si es fijo o 10 si es celular.')
  }
  if (
    esSistemaClasificacion(campos.sistemaClasificacion) &&
    !esGrupoClasificacion(campos.grupoClasificacion)
  ) {
    marcarError('grupoClasificacion', 'Escriba un grupo entre A1 y D21, como C12.')
  }
}

export function aDatosExtendidos(campos: CamposExtendidos): DatosExtendidos {
  const sistema = campos.sistemaClasificacion
  return {
    documento: campos.sinDocumento
      ? null
      : { tipo: campos.tipoDocumento, numero: campos.numeroDocumento },
    telefono: campos.telefono,
    clasificacion: esSistemaClasificacion(sistema)
      ? { sistema, grupo: campos.grupoClasificacion }
      : null,
  }
}
