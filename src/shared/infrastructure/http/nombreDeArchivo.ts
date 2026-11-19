// `filename*=UTF-8''padr%C3%B3n.xlsx` (RFC 5987) permite tildes; `filename="padron.xlsx"` no.
const NOMBRE_EXTENDIDO = /filename\*\s*=\s*(?:UTF-8|utf-8)''([^;]+)/
const NOMBRE_SIMPLE = /filename\s*=\s*(?:"([^"]*)"|([^;]+))/

function sinRutas(nombre: string): string | null {
  // El servidor solo propone el nombre: nunca una carpeta donde guardarlo.
  const limpio = nombre.trim().split(/[/\\]/).at(-1) ?? ''
  return limpio === '' ? null : limpio
}

/** Lee el nombre del archivo del encabezado `Content-Disposition`, o `null` si no viene. */
export function nombreDeArchivo(contentDisposition: string | null | undefined): string | null {
  if (!contentDisposition) return null

  const extendido = NOMBRE_EXTENDIDO.exec(contentDisposition)
  if (extendido?.[1]) {
    try {
      return sinRutas(decodeURIComponent(extendido[1].trim()))
    } catch {
      // Un nombre mal codificado no impide la descarga: se prueba con `filename`.
    }
  }

  const simple = NOMBRE_SIMPLE.exec(contentDisposition)
  const nombre = simple?.[1] ?? simple?.[2]
  return nombre === undefined ? null : sinRutas(nombre)
}
