import { describe, expect, it } from 'vitest'
import { calcularEdad, esMenorDeEdad } from '@/modules/beneficiarios/domain/edad.ts'

const HOY = '2026-11-04'

describe('calcularEdad', () => {
  it('calcula los años cumplidos', () => {
    expect(calcularEdad('2014-03-15', HOY)).toBe(12)
  })

  it('el día del cumpleaños ya cuenta el año', () => {
    expect(calcularEdad('2008-11-04', HOY)).toBe(18)
  })

  it('un día antes del cumpleaños todavía no cuenta el año', () => {
    expect(calcularEdad('2008-11-05', HOY)).toBe(17)
  })
})

describe('esMenorDeEdad', () => {
  it('es menor con 17 años', () => {
    expect(esMenorDeEdad('2008-11-05', HOY)).toBe(true)
  })

  it('deja de ser menor el día que cumple 18', () => {
    expect(esMenorDeEdad('2008-11-04', HOY)).toBe(false)
  })
})
