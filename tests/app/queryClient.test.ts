import { describe, expect, it } from 'vitest'
import { crearQueryClient, debeReintentar } from '@/app/queryClient.ts'
import { ErrorApi, type TipoErrorApi } from '@/shared/application/errores/ErrorApi.ts'

describe('debeReintentar', () => {
  it.each<TipoErrorApi>(['red', 'servidor'])('reintenta un error de tipo %s', (tipo) => {
    expect(debeReintentar(0, new ErrorApi({ tipo }))).toBe(true)
  })

  it.each<TipoErrorApi>([
    'tiempo-agotado',
    'cancelada',
    'no-autenticado',
    'sin-permiso',
    'no-encontrado',
    'conflicto',
    'validacion',
    'respuesta-invalida',
    'desconocido',
  ])('no reintenta un error de tipo %s', (tipo) => {
    expect(debeReintentar(0, new ErrorApi({ tipo }))).toBe(false)
  })

  it('deja de reintentar al llegar al máximo', () => {
    expect(debeReintentar(2, new ErrorApi({ tipo: 'red' }))).toBe(false)
  })

  it('no reintenta errores que no vienen de la API', () => {
    expect(debeReintentar(0, new Error('fallo de programación'))).toBe(false)
  })
})

describe('crearQueryClient', () => {
  it('nunca reintenta ni pausa una escritura', () => {
    const { mutations } = crearQueryClient().getDefaultOptions()

    expect(mutations).toMatchObject({ retry: false, networkMode: 'always' })
  })
})
