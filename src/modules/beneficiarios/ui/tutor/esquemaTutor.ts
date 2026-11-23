import { z } from 'zod'
import {
  etiquetaTipoDocumento,
  normalizarNumeroDocumento,
  TIPOS_DOCUMENTO_TUTOR,
  type TipoDocumentoTutor,
} from '@/modules/beneficiarios/domain/documento.ts'
import {
  cumpleFormatoDocumento,
  FORMATOS_DOCUMENTO,
  mensajeDeFormato,
} from '@/modules/beneficiarios/domain/formatoDocumento.ts'
import type { NuevaAutorizacionTutor } from '@/modules/beneficiarios/domain/NuevaAutorizacionTutor.ts'
import { PARENTESCOS, type Parentesco } from '@/modules/beneficiarios/domain/parentesco.ts'
import { motivoDeRechazo } from '@/modules/beneficiarios/domain/soporteAutorizacion.ts'
import { esTelefonoValido, normalizarTelefono } from '@/modules/beneficiarios/domain/telefono.ts'

// Límite del contrato (docs/CONSENTIMIENTOS.md, 6.1).
const MAXIMO_NOMBRE = 150

export const esquemaTutor = z
  .object({
    nombre: z.string().trim(),
    parentesco: z.string(),
    tipoDocumento: z.string(),
    numeroDocumento: z.string().trim(),
    telefono: z.string().trim(),
    soporte: z.instanceof(File).nullable(),
    revisado: z.boolean(),
  })
  .superRefine((campos, contexto) => {
    function marcarError(campo: keyof typeof campos, mensaje: string) {
      contexto.addIssue({ code: 'custom', path: [campo], message: mensaje })
    }

    if (campos.nombre === '') {
      marcarError('nombre', 'Escriba el nombre del tutor como aparece en el papel.')
    } else if (campos.nombre.length > MAXIMO_NOMBRE) {
      marcarError('nombre', `El nombre no puede pasar de ${MAXIMO_NOMBRE} caracteres.`)
    }

    if (!(PARENTESCOS as readonly string[]).includes(campos.parentesco)) {
      marcarError('parentesco', 'Elija qué es del menor.')
    }

    const tipo = campos.tipoDocumento as TipoDocumentoTutor
    const numero = normalizarNumeroDocumento(campos.numeroDocumento)
    if (!TIPOS_DOCUMENTO_TUTOR.includes(tipo)) {
      marcarError('tipoDocumento', 'Elija el tipo de documento.')
    } else if (numero === '') {
      marcarError('numeroDocumento', 'Escriba el número de documento del tutor.')
    } else if (!cumpleFormatoDocumento(tipo, numero)) {
      marcarError(
        'numeroDocumento',
        mensajeDeFormato(etiquetaTipoDocumento(tipo), FORMATOS_DOCUMENTO[tipo]),
      )
    }

    const telefono = normalizarTelefono(campos.telefono)
    if (telefono === '') {
      marcarError('telefono', 'Escriba el teléfono del tutor.')
    } else if (!esTelefonoValido(telefono)) {
      marcarError('telefono', 'Revise el teléfono: 7 dígitos si es fijo o 10 si es celular.')
    }

    if (campos.soporte === null) {
      marcarError('soporte', 'Tómele una foto al papel firmado o elija el archivo.')
    } else {
      const motivo = motivoDeRechazo(campos.soporte)
      if (motivo !== null) marcarError('soporte', motivo)
    }

    if (!campos.revisado) {
      marcarError('revisado', 'Marque la casilla después de revisar el papel firmado.')
    }
  })

export type CamposTutor = z.infer<typeof esquemaTutor>

export const CAMPOS_TUTOR_INICIALES: CamposTutor = {
  nombre: '',
  parentesco: '',
  tipoDocumento: 'CC',
  numeroDocumento: '',
  telefono: '',
  soporte: null,
  revisado: false,
}

/** Solo se llama con campos que ya pasaron `esquemaTutor`. */
export function aNuevaAutorizacionTutor(campos: CamposTutor): NuevaAutorizacionTutor {
  return {
    nombre: campos.nombre,
    parentesco: campos.parentesco as Parentesco,
    tipoDocumento: campos.tipoDocumento as TipoDocumentoTutor,
    numeroDocumento: campos.numeroDocumento,
    telefono: campos.telefono,
    soporte: campos.soporte as File,
  }
}
