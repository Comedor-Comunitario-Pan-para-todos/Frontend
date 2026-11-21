import { describe, expect, it } from 'vitest'
import { nombreDeArchivo } from '@/shared/infrastructure/http/nombreDeArchivo.ts'

describe('nombreDeArchivo', () => {
  it.each([
    ['attachment; filename="padron.xlsx"', 'padron.xlsx'],
    ['attachment; filename=padron.xlsx', 'padron.xlsx'],
    ["attachment; filename*=UTF-8''padr%C3%B3n%202026.xlsx", 'padrón 2026.xlsx'],
    // Si vienen los dos, manda el que admite tildes.
    ['attachment; filename="padron.xlsx"; filename*=UTF-8\'\'padr%C3%B3n.xlsx', 'padrón.xlsx'],
  ])('lee %s', (encabezado, esperado) => {
    expect(nombreDeArchivo(encabezado)).toBe(esperado)
  })

  it('sin encabezado o sin nombre devuelve null', () => {
    expect(nombreDeArchivo(null)).toBeNull()
    expect(nombreDeArchivo(undefined)).toBeNull()
    expect(nombreDeArchivo('attachment')).toBeNull()
    expect(nombreDeArchivo('attachment; filename=""')).toBeNull()
  })

  it('descarta las carpetas: el servidor solo propone el nombre', () => {
    expect(nombreDeArchivo('attachment; filename="../../config/padron.xlsx"')).toBe('padron.xlsx')
    expect(nombreDeArchivo('attachment; filename="C:\\\\datos\\\\padron.xlsx"')).toBe('padron.xlsx')
  })

  it('si el nombre extendido está mal codificado, usa el simple', () => {
    expect(nombreDeArchivo('attachment; filename="padron.xlsx"; filename*=UTF-8\'\'%E0%A4%A')).toBe(
      'padron.xlsx',
    )
  })
})
