import { AxiosError, AxiosHeaders, CanceledError, type AxiosResponse } from 'axios'
import { describe, expect, it } from 'vitest'
import { ErrorApi } from '@/shared/application/errores/ErrorApi.ts'
import { normalizarError, tipoPorEstado } from '@/shared/infrastructure/http/normalizarError.ts'

function errorConRespuesta(status: number, data: unknown): AxiosError {
  const config = { headers: new AxiosHeaders() }
  const respuesta: AxiosResponse = { status, statusText: '', data, headers: {}, config }
  return new AxiosError('fallo', 'ERR_BAD_RESPONSE', config, null, respuesta)
}

describe('tipoPorEstado', () => {
  it.each([
    [400, 'validacion'],
    [422, 'validacion'],
    [401, 'no-autenticado'],
    [403, 'sin-permiso'],
    [404, 'no-encontrado'],
    [409, 'conflicto'],
    [500, 'servidor'],
    [503, 'servidor'],
    [418, 'desconocido'],
  ] as const)('%i → %s', (estado, tipo) => {
    expect(tipoPorEstado(estado)).toBe(tipo)
  })
})

describe('normalizarError', () => {
  it('toma el mensaje de texto del cuerpo de Nest', () => {
    const error = normalizarError(
      errorConRespuesta(409, {
        statusCode: 409,
        message: 'Ya existe un usuario con este correo electrónico',
        error: 'Conflict',
      }),
    )

    expect(error).toMatchObject({
      tipo: 'conflicto',
      estado: 409,
      mensajesServidor: ['Ya existe un usuario con este correo electrónico'],
    })
  })

  it('toma la lista de mensajes de una validación de Nest', () => {
    const error = normalizarError(
      errorConRespuesta(400, {
        statusCode: 400,
        message: ['El correo electrónico no es válido', 'La contraseña es requerida'],
        error: 'Bad Request',
      }),
    )

    expect(error.tipo).toBe('validacion')
    expect(error.mensajesServidor).toHaveLength(2)
  })

  it('ignora un cuerpo que no tiene la forma de Nest', () => {
    const error = normalizarError(errorConRespuesta(502, '<html>Bad Gateway</html>'))

    expect(error).toMatchObject({ tipo: 'servidor', estado: 502, mensajesServidor: [] })
  })

  it('sin respuesta es un error de red', () => {
    expect(normalizarError(new AxiosError('Network Error', 'ERR_NETWORK')).tipo).toBe('red')
  })

  it('reconoce el tiempo agotado', () => {
    expect(normalizarError(new AxiosError('timeout', 'ECONNABORTED')).tipo).toBe('tiempo-agotado')
    expect(normalizarError(new AxiosError('timeout', 'ETIMEDOUT')).tipo).toBe('tiempo-agotado')
  })

  it('reconoce una petición cancelada', () => {
    expect(normalizarError(new CanceledError()).tipo).toBe('cancelada')
  })

  it('devuelve tal cual un ErrorApi que ya venía normalizado', () => {
    const original = new ErrorApi({ tipo: 'respuesta-invalida' })

    expect(normalizarError(original)).toBe(original)
  })

  it('convierte cualquier otra cosa en desconocido y conserva la causa', () => {
    const causa = new TypeError('x')
    const error = normalizarError(causa)

    expect(error.tipo).toBe('desconocido')
    expect(error.cause).toBe(causa)
  })
})
