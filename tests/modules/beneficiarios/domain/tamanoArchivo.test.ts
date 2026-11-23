import { describe, expect, it } from 'vitest'
import { formatearTamano } from '@/modules/beneficiarios/domain/tamanoArchivo.ts'

describe('formatearTamano', () => {
  it.each([
    [350 * 1024, '350 KB'],
    [1536, '2 KB'],
    [10, '1 KB'],
    [1024 * 1024, '1 MB'],
    [1.25 * 1024 * 1024, '1,3 MB'],
    [5 * 1024 * 1024, '5 MB'],
  ])('%i bytes se leen "%s"', (bytes, esperado) => {
    expect(formatearTamano(bytes)).toBe(esperado)
  })
})
