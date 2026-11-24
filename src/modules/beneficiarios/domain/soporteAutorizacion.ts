export const FORMATOS_SOPORTE = ['application/pdf', 'image/jpeg', 'image/png'] as const

export const TAMANO_MAXIMO_SOPORTE = 5 * 1024 * 1024

export function motivoDeRechazo(soporte: Pick<File, 'type' | 'size'>): string | null {
  if (!(FORMATOS_SOPORTE as readonly string[]).includes(soporte.type)) {
    return 'El soporte debe ser una foto (JPG o PNG) o un PDF.'
  }
  if (soporte.size === 0) return 'El archivo del soporte está vacío.'
  if (soporte.size > TAMANO_MAXIMO_SOPORTE) return 'El soporte no puede pesar más de 5 MB.'
  return null
}
