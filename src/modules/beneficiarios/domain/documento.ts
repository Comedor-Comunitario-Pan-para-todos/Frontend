export const TIPOS_DOCUMENTO = ['CC', 'TI', 'RC', 'PPT'] as const

export type TipoDocumento = (typeof TIPOS_DOCUMENTO)[number]

const ETIQUETAS: Record<TipoDocumento, string> = {
  CC: 'Cédula de ciudadanía',
  TI: 'Tarjeta de identidad',
  RC: 'Registro civil',
  PPT: 'Permiso por Protección Temporal',
}

export interface Documento {
  /** Sigla del tipo. Un registro antiguo puede traer una que no esté en `TIPOS_DOCUMENTO`. */
  readonly tipo: string
  readonly numero: string
}

const DIGITOS_VISIBLES = 4
const OCULTO = '••••'

export function etiquetaTipoDocumento(tipo: string): string {
  return ETIQUETAS[tipo as TipoDocumento] ?? tipo
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
