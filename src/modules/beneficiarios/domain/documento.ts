const ETIQUETAS = {
  CC: 'Cédula de ciudadanía',
  TI: 'Tarjeta de identidad',
  RC: 'Registro civil',
  PPT: 'Permiso por Protección Temporal',
  CE: 'Cédula de extranjería',
  PASAPORTE: 'Pasaporte',
} as const

/** Todos los documentos que conoce la app. */
export type SiglaDocumento = keyof typeof ETIQUETAS

/** Los que se eligen al registrar a un beneficiario. */
export const TIPOS_DOCUMENTO = ['CC', 'TI', 'RC', 'PPT'] as const satisfies SiglaDocumento[]

export type TipoDocumento = (typeof TIPOS_DOCUMENTO)[number]

/** El tutor es un adulto: no lleva tarjeta de identidad ni registro civil (MER, AutorizacionTutor). */
export const TIPOS_DOCUMENTO_TUTOR = [
  'CC',
  'CE',
  'PPT',
  'PASAPORTE',
] as const satisfies SiglaDocumento[]

export type TipoDocumentoTutor = (typeof TIPOS_DOCUMENTO_TUTOR)[number]

export interface Documento {
  /** Sigla del tipo. Un registro antiguo puede traer una que no esté en `TIPOS_DOCUMENTO`. */
  readonly tipo: string
  readonly numero: string
}

const DIGITOS_VISIBLES = 4
const OCULTO = '••••'

export function etiquetaTipoDocumento(tipo: string): string {
  return ETIQUETAS[tipo as SiglaDocumento] ?? tipo
}

/** La forma corta que se ve en pantalla: la sigla, salvo el pasaporte, que no tiene. */
export function siglaVisible(tipo: string): string {
  return tipo === 'PASAPORTE' ? ETIQUETAS.PASAPORTE : tipo
}

/** "42.185.390" y "42185390" son la misma persona: se guarda sin puntos, espacios ni guiones. */
export function normalizarNumeroDocumento(numero: string): string {
  return numero.replace(/[\s.,-]/g, '').toUpperCase()
}

/** Agrupa los dígitos de a tres para leerlos de un vistazo: "42185390" se muestra "42.185.390". */
export function formatearNumeroDocumento(numero: string): string {
  return /^\d+$/.test(numero) ? numero.replace(/\B(?=(\d{3})+$)/g, '.') : numero
}

/** Lo único que puede ver del número quien no tiene permiso. Vacío si el número es muy corto. */
export function ultimosDigitos(numero: string): string {
  return numero.length <= DIGITOS_VISIBLES ? '' : numero.slice(-DIGITOS_VISIBLES)
}

/** Deja ver solo los últimos dígitos, para quien no tiene permiso de ver el documento (RNF-07). */
export function enmascararDocumento(numero: string): string {
  return `${OCULTO}${ultimosDigitos(numero)}`
}
