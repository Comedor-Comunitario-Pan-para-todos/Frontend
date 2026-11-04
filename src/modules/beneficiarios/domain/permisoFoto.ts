import { esMenorDeEdad } from './edad.ts'

/**
 * Regla única para decidir si se puede tomar o subir la foto de un
 * beneficiario. La comparten RF-20 (consentimiento de imagen) y RF-21
 * (protección de menores). Equivale a `puedePublicarFoto()` del MER.
 */

export interface DatosPermisoFoto {
  aceptaUsoImagen: boolean
  fechaNacimiento: string | null
  tieneAutorizacionTutor: boolean
}

export function puedeTomarFoto(datos: DatosPermisoFoto, fechaHoy: string): boolean {
  if (!datos.aceptaUsoImagen) {
    return false
  }

  if (datos.fechaNacimiento === null) {
    return false
  }

  if (esMenorDeEdad(datos.fechaNacimiento, fechaHoy)) {
    return datos.tieneAutorizacionTutor
  }

  return true
}
