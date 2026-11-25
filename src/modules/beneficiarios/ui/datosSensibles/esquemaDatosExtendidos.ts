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
  mensajeDeFormato,
} from '@/modules/beneficiarios/domain/formatoDocumento.ts'
import type { DatosExtendidos } from '@/modules/beneficiarios/domain/NuevoBeneficiario.ts'
import { esTelefonoValido, normalizarTelefono } from '@/modules/beneficiarios/domain/telefono.ts'

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

type MarcarError = (campo: keyof CamposExtendidos, mensaje: string) => void

export function validarDatosExtendidos(campos: CamposExtendidos, marcarError: MarcarError): void {
  if (!campos.sinDocumento) {
    const tipo = campos.tipoDocumento as TipoDocumento
    const numero = normalizarNumeroDocumento(campos.numeroDocumento)
    if (!TIPOS_DOCUMENTO.includes(tipo)) {
      marcarError('tipoDocumento', 'Elija el tipo de documento.')
    } else if (numero !== '' && !cumpleFormatoDocumento(tipo, numero)) {
      marcarError(
        'numeroDocumento',
        mensajeDeFormato(etiquetaTipoDocumento(tipo), FORMATOS_DOCUMENTO[tipo]),
      )
    }
    if (numero === '') {
      marcarError('numeroDocumento', 'Escriba el número o marque «Sin documento».')
    }
  }
  const telefono = normalizarTelefono(campos.telefono)
  if (telefono !== '' && !esTelefonoValido(telefono)) {
    marcarError('telefono', 'Revise el teléfono: 7 dígitos si es fijo o 10 si es celular.')
  }
  if (
    esSistemaClasificacion(campos.sistemaClasificacion) &&
    !esGrupoClasificacion(campos.grupoClasificacion)
  ) {
    marcarError('grupoClasificacion', 'Escriba un grupo entre A1 y D21, como C12.')
  }
}

/** Los datos sensibles que ya tiene la persona, para empezar a editarlos. */
export function aCamposExtendidos(datos: DatosExtendidos): CamposExtendidos {
  return {
    sinDocumento: datos.documento === null,
    tipoDocumento: datos.documento?.tipo ?? CAMPOS_EXTENDIDOS_INICIALES.tipoDocumento,
    numeroDocumento: datos.documento?.numero ?? '',
    telefono: datos.telefono ?? '',
    sistemaClasificacion: datos.clasificacion?.sistema ?? '',
    grupoClasificacion: datos.clasificacion?.grupo ?? '',
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
