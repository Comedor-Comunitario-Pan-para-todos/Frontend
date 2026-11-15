import type { TipoDocumento } from './documento.ts'

export interface FormatoDocumento {
  readonly soloDigitos: boolean
  readonly minimo: number
  readonly maximo: number
}

export const FORMATOS_DOCUMENTO: Record<TipoDocumento, FormatoDocumento> = {
  CC: { soloDigitos: true, minimo: 3, maximo: 10 },
  TI: { soloDigitos: true, minimo: 10, maximo: 11 },
  RC: { soloDigitos: false, minimo: 6, maximo: 11 },
  PPT: { soloDigitos: true, minimo: 4, maximo: 10 },
}

/** Recibe el número ya normalizado (sin puntos, espacios ni guiones). */
export function cumpleFormatoDocumento(tipo: TipoDocumento, numero: string): boolean {
  const { soloDigitos, minimo, maximo } = FORMATOS_DOCUMENTO[tipo]
  const caracteres = soloDigitos ? /^\d+$/ : /^[\dA-Z]+$/
  return caracteres.test(numero) && numero.length >= minimo && numero.length <= maximo
}
