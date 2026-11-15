export function quitarEspaciosSobrantes(texto: string): string {
  return texto.replace(/\s+/g, ' ').trim()
}

/** `null` cuando no queda nada escrito después de limpiar los espacios. */
export function textoONulo(texto: string | null): string | null {
  const limpio = quitarEspaciosSobrantes(texto ?? '')
  return limpio === '' ? null : limpio
}
