const UN_KB = 1024
const UN_MB = 1024 * UN_KB

const formato = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 1 })

/** "350 KB", "1,2 MB": cuánto pesa un archivo, para decidir si vale la pena enviarlo. */
export function formatearTamano(bytes: number): string {
  if (bytes >= UN_MB) return `${formato.format(bytes / UN_MB)} MB`
  return `${formato.format(Math.max(1, Math.round(bytes / UN_KB)))} KB`
}
