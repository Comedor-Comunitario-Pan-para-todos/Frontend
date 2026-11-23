import type { SiglaDocumento } from './documento.ts'

export interface FormatoDocumento {
  readonly soloDigitos: boolean
  readonly minimo: number
  readonly maximo: number
}

const LETRAS_O_NUMEROS: FormatoDocumento = { soloDigitos: false, minimo: 3, maximo: 30 }

export const FORMATOS_DOCUMENTO: Record<SiglaDocumento, FormatoDocumento> = {
  CC: { soloDigitos: true, minimo: 3, maximo: 10 },
  TI: { soloDigitos: true, minimo: 10, maximo: 11 },
  RC: { soloDigitos: false, minimo: 6, maximo: 11 },
  PPT: { soloDigitos: true, minimo: 4, maximo: 10 },
  CE: LETRAS_O_NUMEROS,
  PASAPORTE: LETRAS_O_NUMEROS,
}

export function cumpleFormatoDocumento(tipo: SiglaDocumento, numero: string): boolean {
  const { soloDigitos, minimo, maximo } = FORMATOS_DOCUMENTO[tipo]
  const caracteres = soloDigitos ? /^\d+$/ : /^[\dA-Z]+$/
  return caracteres.test(numero) && numero.length >= minimo && numero.length <= maximo
}

export function mensajeDeFormato(nombreDelDocumento: string, formato: FormatoDocumento): string {
  const { soloDigitos, minimo, maximo } = formato
  const nombre = nombreDelDocumento.charAt(0).toLowerCase() + nombreDelDocumento.slice(1)
  const unidad = soloDigitos ? 'dígitos' : 'letras o números'
  return `Revise el número: ${nombre} lleva de ${minimo} a ${maximo} ${unidad}.`
}
