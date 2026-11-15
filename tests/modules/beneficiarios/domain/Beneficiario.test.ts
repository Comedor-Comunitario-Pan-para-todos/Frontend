import { describe, expect, it } from 'vitest'
import { iniciales, nombreCompleto } from '@/modules/beneficiarios/domain/Beneficiario.ts'

describe('nombreCompleto', () => {
  it('une nombres y apellidos', () => {
    expect(nombreCompleto({ nombres: 'María Elena', apellidos: 'Restrepo' })).toBe(
      'María Elena Restrepo',
    )
  })

  it('quita los espacios sobrantes', () => {
    expect(nombreCompleto({ nombres: '  Carlos   Julio ', apellidos: ' Morales  Restrepo ' })).toBe(
      'Carlos Julio Morales Restrepo',
    )
  })

  it('sin apellidos devuelve solo los nombres', () => {
    expect(nombreCompleto({ nombres: 'Rosa', apellidos: '' })).toBe('Rosa')
  })
})

describe('iniciales', () => {
  it('toma la primera letra del nombre y del apellido', () => {
    expect(iniciales({ nombres: 'María Elena', apellidos: 'Restrepo' })).toBe('MR')
  })

  it('las devuelve en mayúscula e ignora los espacios iniciales', () => {
    expect(iniciales({ nombres: ' ángela', apellidos: ' ospina' })).toBe('ÁO')
  })

  it('sin apellidos devuelve una sola letra', () => {
    expect(iniciales({ nombres: 'Rosa', apellidos: '' })).toBe('R')
  })
})
