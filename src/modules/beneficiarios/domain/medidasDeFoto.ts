export interface Medidas {
  readonly ancho: number
  readonly alto: number
}

/** A 1600 px por el lado largo, una hoja carta se sigue leyendo y la foto pesa unos cientos de KB. */
export const LADO_MAXIMO_FOTO = 1600

/** Achica la foto sin deformarla hasta que su lado largo quepa en `ladoMaximo`; nunca la agranda. */
export function medidasReducidas(medidas: Medidas, ladoMaximo = LADO_MAXIMO_FOTO): Medidas {
  const ladoLargo = Math.max(medidas.ancho, medidas.alto)
  if (ladoLargo <= ladoMaximo) return medidas

  const escala = ladoMaximo / ladoLargo
  return {
    ancho: Math.max(1, Math.round(medidas.ancho * escala)),
    alto: Math.max(1, Math.round(medidas.alto * escala)),
  }
}
