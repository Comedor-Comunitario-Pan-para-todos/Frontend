import { useLayoutEffect, useRef, type RefObject } from 'react'

/** Muestra la foto con una URL temporal que se libera al cambiarla: no queda copia (RNF-01). */
export function useImagenTemporal(archivo: File): RefObject<HTMLImageElement | null> {
  const imagen = useRef<HTMLImageElement>(null)

  // Antes de pintar, para que la imagen no aparezca vacía un instante.
  useLayoutEffect(() => {
    if (!imagen.current) return undefined
    const url = URL.createObjectURL(archivo)
    imagen.current.src = url
    return () => URL.revokeObjectURL(url)
  }, [archivo])

  return imagen
}
