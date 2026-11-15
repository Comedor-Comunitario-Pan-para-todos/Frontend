import { describe, expect, it } from 'vitest'
import { cumpleFormatoDocumento } from '@/modules/beneficiarios/domain/formatoDocumento.ts'

describe('cumpleFormatoDocumento', () => {
  it.each(['123', '42185390', '1023456789'])('acepta la cédula %s', (numero) => {
    expect(cumpleFormatoDocumento('CC', numero)).toBe(true)
  })

  it.each(['12', '10234567890', '42185A90'])('rechaza la cédula %s', (numero) => {
    expect(cumpleFormatoDocumento('CC', numero)).toBe(false)
  })

  it('la tarjeta de identidad lleva 10 u 11 dígitos', () => {
    expect(cumpleFormatoDocumento('TI', '1086999888')).toBe(true)
    expect(cumpleFormatoDocumento('TI', '98031512345')).toBe(true)
    expect(cumpleFormatoDocumento('TI', '108699988')).toBe(false)
  })

  it('el registro civil admite letras, como los seriales antiguos', () => {
    expect(cumpleFormatoDocumento('RC', 'A1B2C3D4')).toBe(true)
    expect(cumpleFormatoDocumento('RC', '1086999888')).toBe(true)
    expect(cumpleFormatoDocumento('RC', 'A1B2')).toBe(false)
  })

  it('el PPT solo lleva dígitos', () => {
    expect(cumpleFormatoDocumento('PPT', '1234567')).toBe(true)
    expect(cumpleFormatoDocumento('PPT', 'P123456')).toBe(false)
  })
})
