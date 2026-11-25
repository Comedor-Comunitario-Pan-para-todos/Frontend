import { quitarEspaciosSobrantes } from './texto.ts'

const LIMITE_SUGERENCIAS = 3
const LARGO_MINIMO_PARA_CONTENER = 3
const LARGO_MINIMO_PARA_ERRATAS = 4
const LARGO_MINIMO_PARA_DOS_ERRATAS = 8

const TILDES_SALVO_LA_DE_LA_EÑE = /(?!\u0303)[\u0300-\u036f]/g
const SIGNOS_Y_ESPACIOS = /[^\p{L}\p{N}]+/gu
const PREFIJO = /^(barrio|bº|br|b|sector|urbanizacion|urb) (?=\S)/

export function claveDeBarrio(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(TILDES_SALVO_LA_DE_LA_EÑE, '')
    .normalize('NFC')
    .toLowerCase()
    .replace(SIGNOS_Y_ESPACIOS, ' ')
    .trim()
}

export function barrioRegistrado(texto: string, barrios: readonly string[]): string | null {
  const clave = claveDeBarrio(texto)
  if (clave === '') return null
  return barrios.find((barrio) => claveDeBarrio(barrio) === clave) ?? null
}

export function sugerirBarrios(texto: string, barrios: readonly string[]): readonly string[] {
  const escritas = formasParaSugerir(texto)
  if (escritas.length === 0) return []
  const talCual = quitarEspaciosSobrantes(texto)

  return barrios
    .filter((barrio) => barrio !== talCual)
    .map((barrio) => ({ barrio, cercania: mejorCercania(escritas, formasParaSugerir(barrio)) }))
    .filter((candidato) => candidato.cercania !== null)
    .sort((a, b) => Number(a.cercania) - Number(b.cercania))
    .slice(0, LIMITE_SUGERENCIAS)
    .map((candidato) => candidato.barrio)
}

function formasParaSugerir(texto: string): readonly string[] {
  const clave = claveDeBarrio(texto)
  if (clave === '') return []
  const formas = new Set([clave, clave.replace(PREFIJO, '')])
  return [...formas].map((forma) => forma.replaceAll(' ', ''))
}

function mejorCercania(escritas: readonly string[], registradas: readonly string[]): number | null {
  const cercanias = escritas
    .flatMap((escrito) => registradas.map((registrado) => cercania(escrito, registrado)))
    .filter((valor) => valor !== null)
  return cercanias.length === 0 ? null : Math.min(...cercanias)
}

function cercania(escrito: string, registrado: string): number | null {
  if (registrado.startsWith(escrito)) return 0
  const contiene =
    escrito.length >= LARGO_MINIMO_PARA_CONTENER &&
    (registrado.includes(escrito) || escrito.includes(registrado))
  if (contiene) return 1
  if (esErrata(escrito, registrado)) return 2
  return null
}

function esErrata(escrito: string, registrado: string): boolean {
  if (escrito.length < LARGO_MINIMO_PARA_ERRATAS) return false
  const permitidas = escrito.length >= LARGO_MINIMO_PARA_DOS_ERRATAS ? 2 : 1
  return distanciaDeEdicion(escrito, registrado) <= permitidas
}

function distanciaDeEdicion(a: string, b: string): number {
  let anterior = Array.from({ length: b.length + 1 }, (_, indice) => indice)
  for (let i = 1; i <= a.length; i++) {
    const actual = [i]
    for (let j = 1; j <= b.length; j++) {
      const cambio = a[i - 1] === b[j - 1] ? 0 : 1
      actual[j] = Math.min(anterior[j] + 1, actual[j - 1] + 1, anterior[j - 1] + cambio)
    }
    anterior = actual
  }
  return anterior[b.length]
}
