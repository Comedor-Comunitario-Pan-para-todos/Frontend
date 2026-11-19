import type { GuiaInduccion } from '@/modules/induccion/domain/GuiaInduccion.ts'
import { modulosEnOrden } from '@/modules/induccion/domain/avanceInduccion.ts'
import type { InduccionRepository } from './ports/InduccionRepository.ts'

interface Dependencias {
  readonly repositorio: InduccionRepository
}

export type ConsultarGuiaInduccion = () => Promise<GuiaInduccion>

/** Trae la guía con los temas ya ordenados para mostrarlos. */
export function crearConsultarGuiaInduccion({ repositorio }: Dependencias): ConsultarGuiaInduccion {
  return async () => {
    const guia = await repositorio.consultar()
    return { ...guia, modulos: modulosEnOrden(guia.modulos) }
  }
}
