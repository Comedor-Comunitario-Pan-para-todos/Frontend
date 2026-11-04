import { puedeTomarFoto } from '@/modules/beneficiarios/domain/permisoFoto.ts'
import type { BeneficiarioRepository } from './ports/BeneficiarioRepository.ts'

export async function subirFotoBeneficiario(
  repositorio: BeneficiarioRepository,
  beneficiarioId: number,
  foto: File,
  fechaHoy: string,
): Promise<void> {
  const datos = await repositorio.obtenerDatosPermisoFoto(beneficiarioId)

  if (!puedeTomarFoto(datos, fechaHoy)) {
    throw new Error('No se puede subir la foto: falta el permiso de imagen o la autorización del acudiente.')
  }

  await repositorio.subirFoto(beneficiarioId, foto)
}
