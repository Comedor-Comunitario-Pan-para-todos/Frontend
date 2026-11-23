import type { Medidas } from '@/modules/beneficiarios/domain/medidasDeFoto.ts'

export interface FotoPort {
  medir(foto: File): Promise<Medidas>
  redibujarEnJpeg(foto: File, medidas: Medidas): Promise<File>
}
