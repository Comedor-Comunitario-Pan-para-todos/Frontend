import { describe, expect, it } from 'vitest'
import {
  erroresDeRango,
  esFechaCalendario,
  esRangoValido,
} from '@/modules/reportes/domain/RangoFechas.ts'

const HOY = '2026-11-19'

describe('esFechaCalendario', () => {
  it.each(['2026-11-19', '2024-02-29', '2026-01-01'])('%s es una fecha', (fecha) => {
    expect(esFechaCalendario(fecha)).toBe(true)
  })

  it.each(['', '19/11/2026', '2026-1-9', '2026-04-31', '2025-02-29', '2026-13-01'])(
    '%s no es una fecha',
    (texto) => {
      expect(esFechaCalendario(texto)).toBe(false)
    },
  )
})

describe('erroresDeRango', () => {
  it('un rango hasta hoy no tiene errores', () => {
    expect(erroresDeRango({ desde: '2026-11-01', hasta: HOY }, HOY)).toEqual({})
    expect(esRangoValido({ desde: '2026-11-01', hasta: HOY }, HOY)).toBe(true)
  })

  it('un solo día es un rango válido', () => {
    expect(esRangoValido({ desde: '2026-11-08', hasta: '2026-11-08' }, HOY)).toBe(true)
  })

  it('pide las dos fechas', () => {
    expect(erroresDeRango({ desde: '', hasta: '' }, HOY)).toEqual({
      desde: 'vacia',
      hasta: 'vacia',
    })
  })

  it('rechaza fechas que no existen', () => {
    expect(erroresDeRango({ desde: '2026-02-30', hasta: HOY }, HOY)).toEqual({
      desde: 'invalida',
    })
  })

  it('no acepta fechas posteriores a hoy', () => {
    expect(erroresDeRango({ desde: '2026-11-01', hasta: '2026-11-20' }, HOY)).toEqual({
      hasta: 'futura',
    })
  })

  it('el inicio no puede quedar después del final', () => {
    const rango = { desde: '2026-11-10', hasta: '2026-11-01' }

    expect(erroresDeRango(rango, HOY)).toEqual({ desde: 'posterior-a-hasta' })
    expect(esRangoValido(rango, HOY)).toBe(false)
  })

  it('si una fecha ya está mal, no compara el orden', () => {
    expect(erroresDeRango({ desde: '2026-11-25', hasta: '2026-11-01' }, HOY)).toEqual({
      desde: 'futura',
    })
  })
})
