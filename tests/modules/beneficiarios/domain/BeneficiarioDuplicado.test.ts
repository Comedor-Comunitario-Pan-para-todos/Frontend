import { describe, expect, it } from 'vitest'
import {
  BeneficiarioDuplicado,
  esBeneficiarioDuplicado,
} from '@/modules/beneficiarios/domain/BeneficiarioDuplicado.ts'

describe('BeneficiarioDuplicado', () => {
  it('conserva el documento repetido y la causa', () => {
    const causa = new Error('409')
    const error = new BeneficiarioDuplicado('1088234567', causa)

    expect(error.numeroDocumento).toBe('1088234567')
    expect(error.cause).toBe(causa)
    expect(error.name).toBe('BeneficiarioDuplicado')
  })

  it('sin documento conocido lo deja en null', () => {
    expect(new BeneficiarioDuplicado().numeroDocumento).toBeNull()
  })

  it('el mensaje no incluye datos personales', () => {
    expect(new BeneficiarioDuplicado('1088234567').message).not.toContain('1088234567')
  })

  it('se distingue de cualquier otro error', () => {
    expect(esBeneficiarioDuplicado(new BeneficiarioDuplicado())).toBe(true)
    expect(esBeneficiarioDuplicado(new Error('otro'))).toBe(false)
    expect(esBeneficiarioDuplicado(null)).toBe(false)
  })
})
