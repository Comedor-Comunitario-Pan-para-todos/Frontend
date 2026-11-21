import { vi } from 'vitest'
import type { ConsentimientoRepository } from '@/modules/beneficiarios/application/ports/ConsentimientoRepository.ts'
import type { Consentimiento } from '@/modules/beneficiarios/domain/Consentimiento.ts'
import type { RegistroConsentimiento } from '@/modules/beneficiarios/domain/RegistroConsentimiento.ts'

export const CONSENTIMIENTO: Consentimiento = {
  versionPolitica: 1,
  finalidad: 'ATENCION_ALIMENTARIA',
  registradoEn: '2026-11-19T15:00:00.000Z',
  registradoPor: 'Voluntario de Prueba',
}

export const AUTORIZACION_IMAGEN: Consentimiento = {
  versionPolitica: 1,
  finalidad: 'USO_IMAGEN',
  registradoEn: '2026-11-20T15:00:00.000Z',
  registradoPor: 'Voluntario de Prueba',
}

export const AUTORIZACION_IMAGEN_RETIRADA: RegistroConsentimiento = {
  ...AUTORIZACION_IMAGEN,
  revocadoEn: '2026-11-21T10:00:00.000Z',
  revocadoPor: 'Coordinación de Prueba',
}

export function crearRepositorioDeConsentimientos(): ConsentimientoRepository {
  return {
    registrar: vi.fn().mockResolvedValue(CONSENTIMIENTO),
    revocar: vi.fn().mockResolvedValue(AUTORIZACION_IMAGEN_RETIRADA),
    consultarHistorial: vi.fn().mockResolvedValue([]),
  }
}
