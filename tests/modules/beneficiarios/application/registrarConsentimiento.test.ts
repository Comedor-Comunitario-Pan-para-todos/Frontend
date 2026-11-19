import { describe, expect, it, vi } from 'vitest'
import type { ConsentimientoRepository } from '@/modules/beneficiarios/application/ports/ConsentimientoRepository.ts'
import { crearRegistrarConsentimiento } from '@/modules/beneficiarios/application/registrarConsentimiento.ts'
import type { Consentimiento } from '@/modules/beneficiarios/domain/Consentimiento.ts'
import { MARIA } from '../datosDePrueba.ts'

const CONSENTIMIENTO: Consentimiento = {
  versionPolitica: 1,
  finalidad: 'ATENCION_ALIMENTARIA',
  registradoEn: '2026-11-19T15:00:00.000Z',
  registradoPor: 'Voluntario de Prueba',
}

describe('registrarConsentimiento', () => {
  it('guarda la aceptación de la política vigente para esa persona', async () => {
    const repositorio: ConsentimientoRepository = {
      registrar: vi.fn().mockResolvedValue(CONSENTIMIENTO),
    }

    const consentimiento = await crearRegistrarConsentimiento({ repositorio })(MARIA.id)

    expect(consentimiento).toEqual(CONSENTIMIENTO)
    expect(repositorio.registrar).toHaveBeenCalledWith(MARIA.id, {
      version: 1,
      finalidad: 'ATENCION_ALIMENTARIA',
    })
  })
})
