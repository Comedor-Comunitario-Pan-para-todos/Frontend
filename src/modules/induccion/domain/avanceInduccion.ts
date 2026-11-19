import type { GuiaInduccion, ModuloInduccion, ProgresoInduccion } from './GuiaInduccion.ts'

export interface AvanceInduccion {
  readonly leidos: number
  readonly total: number
  readonly minutosRestantes: number
  /** Una guía sin temas no se considera completa: no hay nada que leer todavía. */
  readonly completa: boolean
}

export function estaLeido(progreso: ProgresoInduccion, idModulo: string): boolean {
  return progreso.modulosLeidos.includes(idModulo)
}

export function modulosEnOrden(modulos: readonly ModuloInduccion[]): ModuloInduccion[] {
  return [...modulos].sort((a, b) => a.orden - b.orden)
}

/** Solo cuenta los temas que siguen en la guía: si la coordinadora quita uno, deja de sumar. */
export function calcularAvance({ modulos, progreso }: GuiaInduccion): AvanceInduccion {
  const pendientes = modulos.filter((modulo) => !estaLeido(progreso, modulo.id))
  return {
    leidos: modulos.length - pendientes.length,
    total: modulos.length,
    minutosRestantes: pendientes.reduce((suma, modulo) => suma + modulo.minutosLectura, 0),
    completa: modulos.length > 0 && pendientes.length === 0,
  }
}

/** El tema que se abre al entrar: el primero, en orden, que falta por leer. */
export function primerTemaPendiente({ modulos, progreso }: GuiaInduccion): ModuloInduccion | null {
  return modulosEnOrden(modulos).find((modulo) => !estaLeido(progreso, modulo.id)) ?? null
}

/** Progreso con ese tema marcado o desmarcado, para mostrarlo antes de que responda la API. */
export function conLectura(
  progreso: ProgresoInduccion,
  idModulo: string,
  leido: boolean,
): ProgresoInduccion {
  const otros = progreso.modulosLeidos.filter((id) => id !== idModulo)
  return { modulosLeidos: leido ? [...otros, idModulo] : otros }
}
