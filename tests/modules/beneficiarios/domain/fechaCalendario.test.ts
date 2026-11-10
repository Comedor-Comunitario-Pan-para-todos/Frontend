import { describe, expect, it } from 'vitest'
import { formatearFechaCalendario } from '@/modules/beneficiarios/domain/fechaCalendario.ts'

describe('formatearFechaCalendario', () => {
  it.each([
    ['1958-03-15', '15/03/1958'],
    ['2014-12-01', '01/12/2014'],
  ])('%s se muestra como %s', (fecha, esperado) => {
    expect(formatearFechaCalendario(fecha)).toBe(esperado)
  })

  it.each(['', '15/03/1958', '1958-3-15'])('deja igual lo que no es una fecha ("%s")', (texto) => {
    expect(formatearFechaCalendario(texto)).toBe(texto)
  })
})
