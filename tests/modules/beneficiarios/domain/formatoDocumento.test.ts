import { describe, expect, it } from 'vitest'
import {
  cumpleFormatoDocumento,
  mensajeDeFormato,
} from '@/modules/beneficiarios/domain/formatoDocumento.ts'

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

  it.each(['CE', 'PASAPORTE'] as const)(
    '%s admite letras o números, de 3 a 30 caracteres',
    (tipo) => {
      expect(cumpleFormatoDocumento(tipo, 'AB1234567')).toBe(true)
      expect(cumpleFormatoDocumento(tipo, '123')).toBe(true)
      expect(cumpleFormatoDocumento(tipo, '1'.repeat(30))).toBe(true)
      expect(cumpleFormatoDocumento(tipo, 'A1')).toBe(false)
      expect(cumpleFormatoDocumento(tipo, '1'.repeat(31))).toBe(false)
    },
  )
})

describe('mensajeDeFormato', () => {
  it('nombra el documento y lo que lleva', () => {
    expect(mensajeDeFormato('Pasaporte', { soloDigitos: false, minimo: 3, maximo: 30 })).toBe(
      'Revise el número: pasaporte lleva de 3 a 30 letras o números.',
    )
    expect(
      mensajeDeFormato('Cédula de ciudadanía', { soloDigitos: true, minimo: 3, maximo: 10 }),
    ).toBe('Revise el número: cédula de ciudadanía lleva de 3 a 10 dígitos.')
  })
})
