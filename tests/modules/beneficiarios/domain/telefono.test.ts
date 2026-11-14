import { describe, expect, it } from 'vitest'
import { normalizarTelefono } from '@/modules/beneficiarios/domain/telefono.ts'

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
