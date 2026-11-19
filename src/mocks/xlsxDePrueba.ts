// Arma un .xlsx mínimo pero real (OOXML dentro de un ZIP sin compresión), para que el archivo
// de `pnpm dev:mock` abra en Excel o LibreOffice. En producción el archivo lo genera el backend:
// esto nunca llega al build.

export type CeldaXlsx = string | number | null

const TIPO_XLSX = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

function escaparXml(texto: string): string {
  return texto
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

function columna(indice: number): string {
  let nombre = ''
  let resto = indice + 1
  while (resto > 0) {
    const letra = (resto - 1) % 26
    nombre = String.fromCharCode(65 + letra) + nombre
    resto = Math.floor((resto - 1) / 26)
  }
  return nombre
}

function celda(valor: CeldaXlsx, fila: number, col: number): string {
  const ref = `${columna(col)}${fila}`
  if (valor === null) return ''
  if (typeof valor === 'number') return `<c r="${ref}"><v>${valor}</v></c>`
  return `<c r="${ref}" t="inlineStr"><is><t>${escaparXml(valor)}</t></is></c>`
}

function hoja(filas: readonly (readonly CeldaXlsx[])[]): string {
  const contenido = filas
    .map((fila, i) => `<row r="${i + 1}">${fila.map((v, j) => celda(v, i + 1, j)).join('')}</row>`)
    .join('')
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${contenido}</sheetData></worksheet>`
}

function partes(nombreHoja: string, filas: readonly (readonly CeldaXlsx[])[]) {
  return [
    [
      '[Content_Types].xml',
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>',
    ],
    [
      '_rels/.rels',
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>',
    ],
    [
      'xl/workbook.xml',
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="${escaparXml(nombreHoja)}" sheetId="1" r:id="rId1"/></sheets></workbook>`,
    ],
    [
      'xl/_rels/workbook.xml.rels',
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>',
    ],
    ['xl/worksheets/sheet1.xml', hoja(filas)],
  ] as const
}

const TABLA_CRC = Array.from({ length: 256 }, (_, n) => {
  let c = n
  for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
  return c >>> 0
})

function crc32(datos: Uint8Array): number {
  let crc = 0xffffffff
  for (const byte of datos) crc = TABLA_CRC[(crc ^ byte) & 0xff]! ^ (crc >>> 8)
  return (crc ^ 0xffffffff) >>> 0
}

/** Empaqueta los archivos en un ZIP "stored" (sin compresión), que basta para un OOXML. */
function zip(archivos: readonly (readonly [string, string])[]): Uint8Array<ArrayBuffer> {
  const codificador = new TextEncoder()
  const locales: Uint8Array[] = []
  const centrales: Uint8Array[] = []
  let desplazamiento = 0

  for (const [nombre, texto] of archivos) {
    const nombreBytes = codificador.encode(nombre)
    const datos = codificador.encode(texto)
    const crc = crc32(datos)

    const local = new Uint8Array(30 + nombreBytes.length + datos.length)
    const vl = new DataView(local.buffer)
    vl.setUint32(0, 0x04034b50, true)
    vl.setUint16(4, 20, true)
    vl.setUint32(14, crc, true)
    vl.setUint32(18, datos.length, true)
    vl.setUint32(22, datos.length, true)
    vl.setUint16(26, nombreBytes.length, true)
    local.set(nombreBytes, 30)
    local.set(datos, 30 + nombreBytes.length)

    const central = new Uint8Array(46 + nombreBytes.length)
    const vc = new DataView(central.buffer)
    vc.setUint32(0, 0x02014b50, true)
    vc.setUint16(4, 20, true)
    vc.setUint16(6, 20, true)
    vc.setUint32(16, crc, true)
    vc.setUint32(20, datos.length, true)
    vc.setUint32(24, datos.length, true)
    vc.setUint16(28, nombreBytes.length, true)
    vc.setUint32(42, desplazamiento, true)
    central.set(nombreBytes, 46)

    locales.push(local)
    centrales.push(central)
    desplazamiento += local.length
  }

  const tamanoCentral = centrales.reduce((suma, c) => suma + c.length, 0)
  const fin = new Uint8Array(22)
  const vf = new DataView(fin.buffer)
  vf.setUint32(0, 0x06054b50, true)
  vf.setUint16(8, archivos.length, true)
  vf.setUint16(10, archivos.length, true)
  vf.setUint32(12, tamanoCentral, true)
  vf.setUint32(16, desplazamiento, true)

  const total = new Uint8Array(desplazamiento + tamanoCentral + fin.length)
  let posicion = 0
  for (const parte of [...locales, ...centrales, fin]) {
    total.set(parte, posicion)
    posicion += parte.length
  }
  return total
}

/** Bytes de un libro de Excel con una hoja. La primera fila suele ser el encabezado. */
export function crearXlsx(nombreHoja: string, filas: readonly (readonly CeldaXlsx[])[]) {
  return { bytes: zip(partes(nombreHoja, filas)), tipo: TIPO_XLSX }
}
