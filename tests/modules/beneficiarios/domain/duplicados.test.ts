import { describe, expect, it } from 'vitest'
import { esPosibleDuplicado, normalizarNombre } from '@/modules/beneficiarios/domain/duplicados.ts'

const MARIA = { nombres: 'María Elena', apellidos: 'Restrepo', fechaNacimiento: '1958-03-15' }

describe('normalizarNombre', () => {
  it.each([
    ['María José', 'maria jose'],
    ['  CARLOS   julio ', 'carlos julio'],
    ['Peñaranda', 'penaranda'],
    ['Agüero', 'aguero'],
    ['', ''],
  ])('"%s" se compara como "%s"', (escrito, esperado) => {
    expect(normalizarNombre(escrito)).toBe(esperado)
  })
})

describe('esPosibleDuplicado', () => {
  it('coincide con el mismo nombre y la misma fecha de nacimiento', () => {
    expect(esPosibleDuplicado(MARIA, { ...MARIA })).toBe(true)
  })

  it('ignora tildes, mayúsculas y espacios sobrantes', () => {
    const escrito = { ...MARIA, nombres: ' maria  ELENA', apellidos: 'restrepo ' }

    expect(esPosibleDuplicado(escrito, MARIA)).toBe(true)
  })

  it('coincide aunque un nombre se haya escrito en la casilla de apellidos', () => {
    const escrito = { ...MARIA, nombres: 'María', apellidos: 'Elena Restrepo' }

    expect(esPosibleDuplicado(escrito, MARIA)).toBe(true)
  })

  it('no coincide si la fecha de nacimiento es otra', () => {
    expect(esPosibleDuplicado({ ...MARIA, fechaNacimiento: '1958-03-16' }, MARIA)).toBe(false)
  })

  it('no coincide si el nombre es otro', () => {
    expect(esPosibleDuplicado({ ...MARIA, apellidos: 'Restrepo Gómez' }, MARIA)).toBe(false)
  })
})
