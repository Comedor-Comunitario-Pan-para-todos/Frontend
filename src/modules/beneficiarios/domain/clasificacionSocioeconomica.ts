// Desde agosto de 2026 el RUI reemplaza gradualmente al Sisbén IV; ambos usan la misma escala.
export const SISTEMAS_CLASIFICACION = ['RUI', 'SISBEN_IV'] as const

export type SistemaClasificacion = (typeof SISTEMAS_CLASIFICACION)[number]

export interface ClasificacionSocioeconomica {
  readonly sistema: SistemaClasificacion
  /** Subgrupo, por ejemplo "A3" o "C12". */
  readonly grupo: string
}

const SUBGRUPOS_POR_GRUPO = { A: 5, B: 7, C: 18, D: 21 } as const

type Grupo = keyof typeof SUBGRUPOS_POR_GRUPO

/** Los 51 subgrupos, de A1 (menores ingresos) a D21. */
export const GRUPOS_CLASIFICACION: readonly string[] = Object.entries(SUBGRUPOS_POR_GRUPO).flatMap(
  ([grupo, cantidad]) => Array.from({ length: cantidad }, (_, i) => `${grupo}${i + 1}`),
)

// Validación

export function esSistemaClasificacion(valor: string): valor is SistemaClasificacion {
  return SISTEMAS_CLASIFICACION.includes(valor as SistemaClasificacion)
}

export function esGrupoClasificacion(valor: string): boolean {
  return GRUPOS_CLASIFICACION.includes(valor)
}

// Presentación

const ETIQUETAS_SISTEMA: Record<SistemaClasificacion, string> = {
  RUI: 'Registro Universal de Ingresos (RUI)',
  SISBEN_IV: 'Sisbén IV',
}

const DESCRIPCION_GRUPO: Record<Grupo, string> = {
  A: 'Pobreza extrema',
  B: 'Pobreza moderada',
  C: 'Vulnerable',
  D: 'No pobre ni vulnerable',
}

export function etiquetaSistemaClasificacion(sistema: string): string {
  return ETIQUETAS_SISTEMA[sistema as SistemaClasificacion] ?? sistema
}

/** "C12" → "Vulnerable". Vacío si el subgrupo no es válido. */
export function descripcionGrupo(grupo: string): string {
  return esGrupoClasificacion(grupo) ? DESCRIPCION_GRUPO[grupo.charAt(0) as Grupo] : ''
}
