import { normalizarNumeroDocumento, type Documento } from './documento.ts'

export interface Beneficiario {
  readonly id: string
  readonly nombres: string
  readonly apellidos: string
  /** `null` cuando la persona no tiene documento: no es motivo para negarle la atención. */
  readonly documento: Documento | null
  /** Fecha de calendario `AAAA-MM-DD`, sin hora ni zona horaria. */
  readonly fechaNacimiento: string
  readonly barrio: string | null
  readonly telefono: string | null
  /** Momento del registro, en formato ISO 8601. */
  readonly registradoEn: string
}

/** Lo que se captura en la reja para registrar a una persona por primera vez. */
export type NuevoBeneficiario = Pick<
  Beneficiario,
  'nombres' | 'apellidos' | 'documento' | 'fechaNacimiento' | 'barrio'
>

type Nombre = Pick<Beneficiario, 'nombres' | 'apellidos'>

function quitarEspaciosSobrantes(texto: string): string {
  return texto.replace(/\s+/g, ' ').trim()
}

export function nombreCompleto({ nombres, apellidos }: Nombre): string {
  return quitarEspaciosSobrantes(`${nombres} ${apellidos}`)
}

/**
 * Deja los datos como deben guardarse: sin espacios sobrantes, con el documento sin separadores
 * y con `null` donde no se escribió nada. Un documento sin número cuenta como "sin documento".
 */
export function limpiarNuevoBeneficiario(datos: NuevoBeneficiario): NuevoBeneficiario {
  const numero = normalizarNumeroDocumento(datos.documento?.numero ?? '')
  const barrio = quitarEspaciosSobrantes(datos.barrio ?? '')

  return {
    nombres: quitarEspaciosSobrantes(datos.nombres),
    apellidos: quitarEspaciosSobrantes(datos.apellidos),
    documento: datos.documento && numero !== '' ? { tipo: datos.documento.tipo, numero } : null,
    fechaNacimiento: datos.fechaNacimiento,
    barrio: barrio === '' ? null : barrio,
  }
}

/** Primera letra del nombre y del apellido, para el distintivo de la tarjeta ("MR"). */
export function iniciales({ nombres, apellidos }: Nombre): string {
  return [nombres, apellidos].map((parte) => parte.trim().charAt(0).toUpperCase()).join('')
}
