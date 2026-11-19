import type { GuiaInduccion, ProgresoInduccion } from '@/modules/induccion/domain/GuiaInduccion.ts'

export interface InduccionRepository {
  /** Los temas de la guía y el avance del voluntario con la sesión abierta. */
  consultar(): Promise<GuiaInduccion>
  /** Devuelve el progreso tal como quedó guardado. */
  registrarLectura(idModulo: string, leido: boolean): Promise<ProgresoInduccion>
}
