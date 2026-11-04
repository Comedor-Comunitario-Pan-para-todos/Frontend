import { describe, expect, it } from 'vitest'
import { validarArchivoAutorizacion } from '@/modules/beneficiarios/domain/archivoAutorizacion.ts'

const UN_MEGABYTE = 1024 * 1024

describe('validarArchivoAutorizacion', () => {
  it('acepta un PDF de 1 MB', () => {
    expect(validarArchivoAutorizacion('application/pdf', UN_MEGABYTE)).toBeNull()
  })

  it('acepta una foto JPG', () => {
    expect(validarArchivoAutorizacion('image/jpeg', UN_MEGABYTE)).toBeNull()
  })

  it('rechaza un formato no permitido', () => {
    expect(validarArchivoAutorizacion('image/gif', UN_MEGABYTE)).toBe('El archivo debe ser PDF, JPG o PNG.')
  })

  it('rechaza un archivo de más de 5 MB', () => {
    expect(validarArchivoAutorizacion('application/pdf', 6 * UN_MEGABYTE)).toBe(
      'El archivo no puede pesar más de 5 MB.',
    )
  })
})
