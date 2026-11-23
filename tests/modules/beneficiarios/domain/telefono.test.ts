import { describe, expect, it } from 'vitest'
import { esTelefonoValido, normalizarTelefono } from '@/modules/beneficiarios/domain/telefono.ts'

describe('normalizarTelefono', () => {
  it.each(['315 123 4567', '315-123-4567', '(315) 123.4567'])(
    '"%s" queda solo con dígitos',
    (t) => {
      expect(normalizarTelefono(t)).toBe('3151234567')
    },
  )

  it('conserva el indicativo internacional', () => {
    expect(normalizarTelefono('+57 315 123 4567')).toBe('+573151234567')
  })
})

describe('esTelefonoValido', () => {
  it.each(['3101234567', '3341234'])('acepta %s', (telefono) => {
    expect(esTelefonoValido(telefono)).toBe(true)
  })

  it.each(['31012345678', '334123', '310123456A'])('rechaza %s', (telefono) => {
    expect(esTelefonoValido(telefono)).toBe(false)
  })
})
