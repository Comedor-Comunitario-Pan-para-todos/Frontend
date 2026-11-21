import { describe, expect, it } from 'vitest'
import { calcularEdad, esMenorDeEdad } from '@/modules/beneficiarios/domain/edad.ts'

const HOY = '2026-11-19'

describe('calcularEdad', () => {
  it.each([
    ['1958-03-15', 68],
    ['2014-03-15', 12],
    ['2014-12-01', 11],
  ])('quien nació el %s tiene %i años', (fechaNacimiento, edad) => {
    expect(calcularEdad(fechaNacimiento, HOY)).toBe(edad)
  })

  it('suma el año el mismo día del cumpleaños, no antes', () => {
    expect(calcularEdad('2008-11-20', HOY)).toBe(17)
    expect(calcularEdad('2008-11-19', HOY)).toBe(18)
  })

  it('quien nació un 29 de febrero cumple el 1 de marzo si el año no es bisiesto', () => {
    expect(calcularEdad('2008-02-29', '2026-02-28')).toBe(17)
    expect(calcularEdad('2008-02-29', '2026-03-01')).toBe(18)
  })

  it.each(['', '15/03/1958', '2008-13-01', '2008-11-00', 'hace años'])(
    'no calcula la edad de una fecha que no se puede leer ("%s")',
    (fecha) => {
      expect(calcularEdad(fecha, HOY)).toBeNull()
    },
  )
})

describe('esMenorDeEdad', () => {
  it('es menor hasta el día antes de cumplir 18 años', () => {
    expect(esMenorDeEdad('2008-11-20', HOY)).toBe(true)
    expect(esMenorDeEdad('2008-11-19', HOY)).toBe(false)
  })

  it('un adulto no es menor y un niño sí', () => {
    expect(esMenorDeEdad('1958-03-15', HOY)).toBe(false)
    expect(esMenorDeEdad('2014-03-15', HOY)).toBe(true)
  })

  it('si la fecha no se puede leer, protege como si fuera menor', () => {
    expect(esMenorDeEdad('15/03/1958', HOY)).toBe(true)
  })
})
