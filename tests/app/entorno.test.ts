import { describe, expect, it } from 'vitest'
import { ErrorDeEntorno, leerEntorno } from '@/app/entorno.ts'

describe('leerEntorno', () => {
  it('usa los valores por defecto cuando no hay variables', () => {
    expect(leerEntorno({ PROD: false })).toEqual({ apiBaseUrl: '/api', usarMocks: false })
  })

  it('acepta una URL completa y le quita la barra final', () => {
    const entorno = leerEntorno({ PROD: true, VITE_API_BASE_URL: 'https://api.comedor.org/' })

    expect(entorno.apiBaseUrl).toBe('https://api.comedor.org')
  })

  it('activa los mocks con "true"', () => {
    expect(leerEntorno({ PROD: false, VITE_USAR_MOCKS: 'true' }).usarMocks).toBe(true)
  })

  it('rechaza una base que no es ruta ni URL', () => {
    expect(() => leerEntorno({ PROD: false, VITE_API_BASE_URL: 'api' })).toThrow(ErrorDeEntorno)
  })

  it('rechaza un valor de mocks distinto de "true" o "false"', () => {
    expect(() => leerEntorno({ PROD: false, VITE_USAR_MOCKS: 'si' })).toThrow(/VITE_USAR_MOCKS/)
  })

  it('no permite mocks en producción', () => {
    expect(() => leerEntorno({ PROD: true, VITE_USAR_MOCKS: 'true' })).toThrow(
      /no se permiten mocks/,
    )
  })
})
