import type { FotoPort } from '@/modules/beneficiarios/application/ports/FotoPort.ts'
import type { Medidas } from '@/modules/beneficiarios/domain/medidasDeFoto.ts'

// Con 0.85 el texto escrito a mano se sigue leyendo y el archivo baja a una fracción.
const CALIDAD_JPEG = 0.85

/** Mide y redibuja la foto en un canvas del navegador. No guarda copia (RNF-01). */
export class FotoNavegador implements FotoPort {
  async medir(foto: File): Promise<Medidas> {
    const imagen = await createImageBitmap(foto)
    const medidas = { ancho: imagen.width, alto: imagen.height }
    imagen.close()
    return medidas
  }

  async redibujarEnJpeg(foto: File, { ancho, alto }: Medidas): Promise<File> {
    const imagen = await createImageBitmap(foto)
    const lienzo = document.createElement('canvas')
    lienzo.width = ancho
    lienzo.height = alto
    const contexto = lienzo.getContext('2d')
    if (!contexto) throw new Error('El navegador no puede dibujar la foto')

    // Fondo blanco: un PNG con transparencia quedaría negro en JPEG.
    contexto.fillStyle = '#FFFFFF'
    contexto.fillRect(0, 0, ancho, alto)
    contexto.drawImage(imagen, 0, 0, ancho, alto)
    imagen.close()

    const jpeg = await new Promise<Blob | null>((resolver) =>
      lienzo.toBlob(resolver, 'image/jpeg', CALIDAD_JPEG),
    )
    if (!jpeg) throw new Error('El navegador no pudo convertir la foto')
    return new File([jpeg], `${sinExtension(foto.name)}.jpg`, { type: 'image/jpeg' })
  }
}

function sinExtension(nombre: string): string {
  return nombre.replace(/\.[^.]*$/, '') || 'soporte'
}
