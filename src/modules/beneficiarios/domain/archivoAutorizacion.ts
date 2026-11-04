const FORMATOS_PERMITIDOS = ['application/pdf', 'image/jpeg', 'image/png']
const TAMANO_MAXIMO_BYTES = 5 * 1024 * 1024

export function validarArchivoAutorizacion(tipo: string, tamanoBytes: number): string | null {
  if (!FORMATOS_PERMITIDOS.includes(tipo)) {
    return 'El archivo debe ser PDF, JPG o PNG.'
  }

  if (tamanoBytes > TAMANO_MAXIMO_BYTES) {
    return 'El archivo no puede pesar más de 5 MB.'
  }

  return null
}
