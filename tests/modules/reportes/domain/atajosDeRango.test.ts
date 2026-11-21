import { describe, expect, it } from 'vitest'
import {
  atajoDelRango,
  esAtajoDeRango,
  rangoDeAtajo,
} from '@/modules/reportes/domain/atajosDeRango.ts'

describe('rangoDeAtajo', () => {
  it('este mes va del 1 hasta hoy', () => {
    expect(rangoDeAtajo('ESTE_MES', '2026-11-19')).toEqual({
      desde: '2026-11-01',
      hasta: '2026-11-19',
    })
  })

  it('el mes pasado es el mes anterior completo', () => {
    expect(rangoDeAtajo('MES_PASADO', '2026-11-19')).toEqual({
      desde: '2026-10-01',
      hasta: '2026-10-31',
    })
  })

  it('el mes pasado en enero es diciembre del año anterior', () => {
    expect(rangoDeAtajo('MES_PASADO', '2026-01-15')).toEqual({
      desde: '2025-12-01',
      hasta: '2025-12-31',
    })
  })

  it('respeta los años bisiestos', () => {
    expect(rangoDeAtajo('MES_PASADO', '2028-03-10').hasta).toBe('2028-02-29')
    expect(rangoDeAtajo('MES_PASADO', '2026-03-10').hasta).toBe('2026-02-28')
  })

  it('los últimos 3 meses son el actual y los dos anteriores', () => {
    expect(rangoDeAtajo('ULTIMOS_3_MESES', '2026-11-19')).toEqual({
      desde: '2026-09-01',
      hasta: '2026-11-19',
    })
    expect(rangoDeAtajo('ULTIMOS_3_MESES', '2026-02-03').desde).toBe('2025-12-01')
  })
})

describe('atajoDelRango', () => {
  const HOY = '2026-11-19'

  it('reconoce el atajo que produce el rango', () => {
    expect(atajoDelRango({ desde: '2026-10-01', hasta: '2026-10-31' }, HOY)).toBe('MES_PASADO')
    expect(atajoDelRango({ desde: '2026-11-01', hasta: HOY }, HOY)).toBe('ESTE_MES')
  })

  it('con fechas escritas a mano no hay atajo', () => {
    expect(atajoDelRango({ desde: '2026-11-02', hasta: HOY }, HOY)).toBeNull()
  })
})

describe('esAtajoDeRango', () => {
  it('solo acepta los atajos conocidos', () => {
    expect(esAtajoDeRango('ESTE_MES')).toBe(true)
    expect(esAtajoDeRango('ESTE_ANIO')).toBe(false)
  })
})
