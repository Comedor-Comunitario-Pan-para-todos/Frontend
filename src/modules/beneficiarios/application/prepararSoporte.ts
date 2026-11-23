import { medidasReducidas } from '@/modules/beneficiarios/domain/medidasDeFoto.ts'
import { motivoDeRechazo } from '@/modules/beneficiarios/domain/soporteAutorizacion.ts'
import type { FotoPort } from './ports/FotoPort.ts'

interface Dependencias {
  readonly foto: FotoPort
}

export type PrepararSoporte = (archivo: File) => Promise<File>

/**
 * Achica la foto del papel firmado para que suba rápido con datos móviles, y pasa a JPEG la que
 * llega en otro formato (HEIC, WebP). Un PDF, o una foto que no se puede leer, sigue igual: la
 * validación del soporte decide si sirve.
 */
export function crearPrepararSoporte({ foto }: Dependencias): PrepararSoporte {
  return async (archivo) => {
    if (!archivo.type.startsWith('image/')) return archivo

    try {
      const medidas = await foto.medir(archivo)
      const reducidas = medidasReducidas(medidas)
      const yaSirve = reducidas === medidas && motivoDeRechazo(archivo) === null
      return yaSirve ? archivo : await foto.redibujarEnJpeg(archivo, reducidas)
    } catch {
      return archivo
    }
  }
}
