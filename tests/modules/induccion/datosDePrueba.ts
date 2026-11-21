import type { GuiaInduccion, ModuloInduccion } from '@/modules/induccion/domain/GuiaInduccion.ts'

export const HIGIENE: ModuloInduccion = {
  id: 'higiene',
  orden: 1,
  titulo: 'Higiene antes de servir',
  minutosLectura: 2,
  puntos: ['Lávese las manos con agua y jabón al llegar.'],
}

export const TRATO_DIGNO: ModuloInduccion = {
  id: 'trato-digno',
  orden: 2,
  titulo: 'Trato digno a las personas',
  minutosLectura: 2,
  puntos: ['Sirva la misma porción a todos, sin preferencias.'],
}

export const EMERGENCIAS: ModuloInduccion = {
  id: 'emergencias',
  orden: 3,
  titulo: 'Qué hacer en una emergencia',
  minutosLectura: 3,
  puntos: ['Si alguien se desmaya, no lo mueva y llame al 123.'],
}

export function guiaCon(modulosLeidos: string[] = []): GuiaInduccion {
  return { modulos: [HIGIENE, TRATO_DIGNO, EMERGENCIAS], progreso: { modulosLeidos } }
}
