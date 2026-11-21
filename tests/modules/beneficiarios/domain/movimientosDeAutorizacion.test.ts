import { describe, expect, it } from 'vitest'
import { movimientosDeAutorizacion } from '@/modules/beneficiarios/domain/movimientosDeAutorizacion.ts'
import { AUTORIZACION_IMAGEN, AUTORIZACION_IMAGEN_RETIRADA } from '../consentimientosDePrueba.ts'

const VIGENTE = { ...AUTORIZACION_IMAGEN, revocadoEn: null, revocadoPor: null }

describe('movimientosDeAutorizacion', () => {
  it('sin historial no hay movimientos', () => {
    expect(movimientosDeAutorizacion([])).toEqual([])
  })

  it('una autorización vigente es un solo movimiento', () => {
    expect(movimientosDeAutorizacion([VIGENTE])).toEqual([
      { tipo: 'AUTORIZO', momento: '2026-11-20T15:00:00.000Z', usuario: 'Voluntario de Prueba' },
    ])
  })

  it('una autorización retirada son dos movimientos: primero el retiro', () => {
    expect(movimientosDeAutorizacion([AUTORIZACION_IMAGEN_RETIRADA])).toEqual([
      { tipo: 'RETIRO', momento: '2026-11-21T10:00:00.000Z', usuario: 'Coordinación de Prueba' },
      { tipo: 'AUTORIZO', momento: '2026-11-20T15:00:00.000Z', usuario: 'Voluntario de Prueba' },
    ])
  })

  it('ordena todos los movimientos del más reciente al más antiguo', () => {
    const nueva = {
      ...VIGENTE,
      registradoEn: '2026-11-22T08:00:00.000Z',
      registradoPor: 'Coordinación de Prueba',
    }

    expect(
      movimientosDeAutorizacion([AUTORIZACION_IMAGEN_RETIRADA, nueva]).map((m) => m.momento),
    ).toEqual(['2026-11-22T08:00:00.000Z', '2026-11-21T10:00:00.000Z', '2026-11-20T15:00:00.000Z'])
  })
})
