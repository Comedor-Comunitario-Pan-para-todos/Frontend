import { vi } from 'vitest'
import type { ConsentimientoRepository } from '@/modules/beneficiarios/application/ports/ConsentimientoRepository.ts'
import type { AutorizacionTutor } from '@/modules/beneficiarios/domain/AutorizacionTutor.ts'
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

export const TUTOR_ACTIVO: AutorizacionTutor = {
  id: 'at-1',
  estado: 'ACTIVA',
  tutor: {
    nombre: 'Luz Marina Díaz',
    parentesco: 'MADRE',
    tipoDocumento: 'CC',
    numeroDocumento: '52123456',
    telefono: '3101234567',
  },
  aprobadaPor: 'Coordinación de Prueba',
  fechaAprobacion: '2026-11-18T15:00:00.000Z',
  revocadaEn: null,
  revocadaPor: null,
  motivoRevocacion: null,
}

export const TUTOR_REVOCADO: AutorizacionTutor = {
  ...TUTOR_ACTIVO,
  estado: 'REVOCADA',
  revocadaEn: '2026-11-19T10:00:00.000Z',
  revocadaPor: 'Coordinación de Prueba',
  motivoRevocacion: 'El acudiente ya no está a cargo.',
}
