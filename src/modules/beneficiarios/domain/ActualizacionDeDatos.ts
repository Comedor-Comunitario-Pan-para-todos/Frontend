import {
  limpiarDatosBasicos,
  limpiarDatosExtendidos,
  type DatosBasicos,
  type DatosExtendidos,
} from './NuevoBeneficiario.ts'

export type ActualizacionDeDatos = DatosBasicos & {
  readonly sensibles: DatosExtendidos | null
}

export function limpiarActualizacion(actualizacion: ActualizacionDeDatos): ActualizacionDeDatos {
  return {
    ...limpiarDatosBasicos(actualizacion),
    sensibles: actualizacion.sensibles && limpiarDatosExtendidos(actualizacion.sensibles),
  }
}
