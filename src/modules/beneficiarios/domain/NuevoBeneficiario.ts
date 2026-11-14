import type { Beneficiario } from './Beneficiario.ts'
import { normalizarNumeroDocumento } from './documento.ts'
import { normalizarTelefono } from './telefono.ts'
import { quitarEspaciosSobrantes, textoONulo } from './texto.ts'

export type DatosBasicos = Pick<
  Beneficiario,
  'nombres' | 'apellidos' | 'fechaNacimiento' | 'barrio'
>

/** Datos sensibles (RNF-07): solo se capturan en el nivel extendido. */
export type DatosExtendidos = Pick<Beneficiario, 'documento' | 'telefono' | 'clasificacion'>

/** Lo que se captura para registrar a una persona por primera vez. */
export type NuevoBeneficiario = DatosBasicos &
  ({ readonly nivel: 'BASICO' } | ({ readonly nivel: 'EXTENDIDO' } & DatosExtendidos))

export type NuevoBeneficiarioExtendido = Extract<NuevoBeneficiario, { nivel: 'EXTENDIDO' }>

export function limpiarNuevoBeneficiario(datos: NuevoBeneficiario): NuevoBeneficiario {
  const basicos = limpiarDatosBasicos(datos)

  if (datos.nivel === 'BASICO') {
    return { ...basicos, nivel: 'BASICO' }
  }
  return { ...basicos, ...limpiarDatosExtendidos(datos), nivel: 'EXTENDIDO' }
}

function limpiarDatosBasicos(datos: DatosBasicos): DatosBasicos {
  return {
    nombres: quitarEspaciosSobrantes(datos.nombres),
    apellidos: quitarEspaciosSobrantes(datos.apellidos),
    fechaNacimiento: datos.fechaNacimiento,
    barrio: textoONulo(datos.barrio),
  }
}

/** Un documento sin número cuenta como "sin documento". */
export function limpiarDatosExtendidos(datos: DatosExtendidos): DatosExtendidos {
  const numero = normalizarNumeroDocumento(datos.documento?.numero ?? '')
  const telefono = normalizarTelefono(datos.telefono ?? '')

  return {
    documento: datos.documento && numero !== '' ? { tipo: datos.documento.tipo, numero } : null,
    telefono: telefono === '' ? null : telefono,
    clasificacion: datos.clasificacion,
  }
}
