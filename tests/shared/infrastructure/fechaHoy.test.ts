import { describe, expect, it } from 'vitest'
import { obtenerFechaHoy } from '@/shared/infrastructure/fechaHoy.ts'

describe('obtenerFechaHoy', () => {
  it('usa la fecha de Bogotá aunque en UTC ya sea el día siguiente', () => {
    const ahora = new Date('2026-11-04T03:30:00Z')
    expect(obtenerFechaHoy(ahora)).toBe('2026-11-03')
  })

  it('cambia de día a la medianoche de Bogotá', () => {
    const ahora = new Date('2026-11-04T05:00:00Z')
    expect(obtenerFechaHoy(ahora)).toBe('2026-11-04')
  })
})
