const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function esUuid(valor: string): boolean {
  return UUID.test(valor)
}

export function texto(valor: unknown): string {
  return typeof valor === 'string' ? valor.trim() : ''
}

export function esCargaDePagina(request: Request): boolean {
  return request.headers.get('Accept')?.includes('text/html') ?? false
}

/** Lee un cuerpo `multipart/form-data`, o `null` si no lo es. */
export async function leerFormulario(request: Request): Promise<FormData | null> {
  const tipo = request.headers.get('Content-Type') ?? ''
  if (!tipo.startsWith('multipart/form-data')) return null
  const bytes = new Uint8Array(await request.arrayBuffer())

  try {
    return await new Response(bytes, { headers: { 'Content-Type': tipo } }).formData()
  } catch {
    // En jsdom (pruebas) el lector nativo no funciona: se lee a mano.
    return leerMultipart(bytes, tipo)
  }
}

function leerMultipart(bytes: Uint8Array, tipo: string): FormData | null {
  const separador = /boundary=(?:"([^"]+)"|([^;]+))/.exec(tipo)
  if (!separador) return null
  // latin1 hace corresponder cada byte con un carácter: el archivo no se daña.
  const cuerpo = new TextDecoder('latin1').decode(bytes)
  const formulario = new FormData()

  for (const parte of cuerpo.split(`--${separador[1] ?? separador[2]}`).slice(1, -1)) {
    const finEncabezados = parte.indexOf('\r\n\r\n')
    const encabezados = parte.slice(0, finEncabezados)
    const contenido = aBytes(parte.slice(finEncabezados + 4, -2))
    const nombre = /name="([^"]*)"/.exec(encabezados)?.[1]
    if (nombre === undefined) continue

    const archivo = /filename="([^"]*)"/.exec(encabezados)?.[1]
    if (archivo === undefined) {
      formulario.append(nombre, new TextDecoder().decode(contenido))
    } else {
      const tipoArchivo = /Content-Type:\s*([^\r\n]+)/i.exec(encabezados)?.[1] ?? ''
      formulario.append(nombre, new File([contenido], archivo, { type: tipoArchivo }))
    }
  }
  return formulario
}

function aBytes(latin1: string): Uint8Array<ArrayBuffer> {
  return Uint8Array.from(latin1, (caracter) => caracter.charCodeAt(0))
}
