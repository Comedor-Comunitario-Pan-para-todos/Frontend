import { describe, expect, it } from 'vitest'
import { ErrorApi } from '@/shared/application/errores/ErrorApi.ts'
import { mensajeDeError } from '@/shared/ui/mensajeDeError.ts'

describe('mensajeDeError', () => {
  it('da un mensaje propio para cada tipo', () => {
    expect(mensajeDeError(new ErrorApi({ tipo: 'red' }))).toMatch(/conexión/)
    expect(mensajeDeError(new ErrorApi({ tipo: 'sin-permiso', estado: 403 }))).toMatch(/permiso/)
  })

  it('muestra los mensajes del servidor en validación, unidos', () => {
    const error = new ErrorApi({
      tipo: 'validacion',
      estado: 400,
      mensajesServidor: ['El correo electrónico no es válido', 'La contraseña es requerida'],
    })

    expect(mensajeDeError(error)).toBe(
      'El correo electrónico no es válido. La contraseña es requerida',
    )
  })

  it('muestra el mensaje del servidor en un 401', () => {
    const error = new ErrorApi({
      tipo: 'no-autenticado',
      estado: 401,
      mensajesServidor: ['El usuario se encuentra inactivo'],
    })

    expect(mensajeDeError(error)).toBe('El usuario se encuentra inactivo')
  })

  it('usa el mensaje por defecto si el servidor no envió texto', () => {
    expect(mensajeDeError(new ErrorApi({ tipo: 'conflicto', estado: 409 }))).toBe(
      'Ya existe un registro con estos datos.',
    )
  })

  it('nunca muestra el texto del servidor en un 5xx', () => {
    const error = new ErrorApi({
      tipo: 'servidor',
      estado: 500,
      mensajesServidor: ['QueryFailedError: Duplicate entry for key PRIMARY'],
    })

    expect(mensajeDeError(error)).not.toMatch(/QueryFailedError/)
  })

  it('responde con el mensaje genérico ante algo que no es ErrorApi', () => {
    expect(mensajeDeError(new TypeError('x'))).toBe(
      'Ocurrió un error inesperado. Intenta de nuevo.',
    )
  })
})
