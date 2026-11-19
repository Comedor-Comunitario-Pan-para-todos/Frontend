import type { DescargaPort } from '@/modules/reportes/application/ports/DescargaPort.ts'
import type { ArchivoGenerado } from '@/modules/reportes/application/ports/ExportacionRepository.ts'

// Tiempo que se conserva la URL temporal: algunos navegadores empiezan la descarga después del clic.
const VIGENCIA_URL_MS = 10_000

/**
 * Descarga el archivo con un enlace temporal. No se guarda copia en el navegador (RNF-01):
 * la URL del `Blob` se libera unos segundos después.
 */
export class DescargaNavegador implements DescargaPort {
  guardar({ nombre, contenido }: ArchivoGenerado): void {
    const url = URL.createObjectURL(contenido)
    const enlace = document.createElement('a')
    enlace.href = url
    enlace.download = nombre
    enlace.hidden = true
    document.body.append(enlace)
    enlace.click()
    enlace.remove()
    setTimeout(() => URL.revokeObjectURL(url), VIGENCIA_URL_MS)
  }
}
