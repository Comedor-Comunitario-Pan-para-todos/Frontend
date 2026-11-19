import type { ArchivoGenerado } from './ExportacionRepository.ts'

/** Entrega un archivo a la persona: en el navegador, lo descarga al teléfono o al computador. */
export interface DescargaPort {
  guardar(archivo: ArchivoGenerado): void
}
