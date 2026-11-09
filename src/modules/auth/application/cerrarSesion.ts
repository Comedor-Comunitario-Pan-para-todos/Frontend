import type { SesionStoragePort } from './ports/SesionStoragePort.ts'

interface Dependencias {
  readonly almacen: SesionStoragePort
}

export type CerrarSesion = () => void

export function crearCerrarSesion({ almacen }: Dependencias): CerrarSesion {
  return () => {
    almacen.borrarToken()
  }
}
