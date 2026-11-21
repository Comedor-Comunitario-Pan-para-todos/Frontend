/** Un tema corto de la guía de inducción para voluntarios nuevos (RF-15). */
export interface ModuloInduccion {
  readonly id: string
  readonly orden: number
  readonly titulo: string
  readonly minutosLectura: number
  readonly puntos: readonly string[]
}

/** Temas que el voluntario con la sesión abierta marcó como leídos. */
export interface ProgresoInduccion {
  readonly modulosLeidos: readonly string[]
}

export interface GuiaInduccion {
  readonly modulos: readonly ModuloInduccion[]
  readonly progreso: ProgresoInduccion
}
