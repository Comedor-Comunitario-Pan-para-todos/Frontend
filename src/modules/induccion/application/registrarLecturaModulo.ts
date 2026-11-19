import type { ProgresoInduccion } from '@/modules/induccion/domain/GuiaInduccion.ts'
import type { InduccionRepository } from './ports/InduccionRepository.ts'

interface Dependencias {
  readonly repositorio: InduccionRepository
}

export type RegistrarLecturaModulo = (
  idModulo: string,
  leido: boolean,
) => Promise<ProgresoInduccion>

/** Guarda que el voluntario marcó (o desmarcó) un tema como leído. */
export function crearRegistrarLecturaModulo({ repositorio }: Dependencias): RegistrarLecturaModulo {
  return (idModulo, leido) => repositorio.registrarLectura(idModulo, leido)
}
