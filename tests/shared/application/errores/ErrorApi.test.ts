import { describe, expect, it } from 'vitest'
import { ErrorApi, esErrorApi } from '@/shared/application/errores/ErrorApi.ts'

describe('ErrorApi', () => {
  it('conserva el tipo, el estado, los mensajes y la causa', () => {
    const causa = new Error('original')
    const error = new ErrorApi({
      tipo: 'validacion',
      estado: 400,
      mensajesServidor: ['El correo electrónico no es válido'],
      causa,
    })

    expect(error.tipo).toBe('validacion')
    expect(error.estado).toBe(400)
    expect(error.mensajesServidor).toEqual(['El correo electrónico no es válido'])
    expect(error.cause).toBe(causa)
    expect(error.message).toBe('Petición fallida: validacion (400)')
  })

  it('sin respuesta no tiene estado ni mensajes', () => {
    const error = new ErrorApi({ tipo: 'red' })

    expect(error.estado).toBeUndefined()
    expect(error.mensajesServidor).toEqual([])
    expect(error.message).toBe('Petición fallida: red')
  })

  it('esErrorApi distingue un ErrorApi de otros errores', () => {
    expect(esErrorApi(new ErrorApi({ tipo: 'servidor', estado: 500 }))).toBe(true)
    expect(esErrorApi(new Error('otro'))).toBe(false)
    expect(esErrorApi('texto')).toBe(false)
  })
})
