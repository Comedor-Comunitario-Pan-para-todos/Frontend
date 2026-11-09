import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { SesionLocalStorage } from '@/modules/auth/infrastructure/dispositivo/SesionLocalStorage.ts'

function bloquear(metodo: 'getItem' | 'setItem' | 'removeItem') {
  vi.spyOn(Storage.prototype, metodo).mockImplementation(() => {
    throw new DOMException('Bloqueado', 'SecurityError')
  })
}

describe('SesionLocalStorage', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('sin token devuelve null', () => {
    expect(new SesionLocalStorage().obtenerToken()).toBeNull()
  })

  it('guarda el token y sobrevive a una nueva instancia', () => {
    new SesionLocalStorage().guardarToken('jwt')

    expect(new SesionLocalStorage().obtenerToken()).toBe('jwt')
  })

  it('borra el token', () => {
    const almacen = new SesionLocalStorage()
    almacen.guardarToken('jwt')

    almacen.borrarToken()

    expect(almacen.obtenerToken()).toBeNull()
  })

  it('si no se puede escribir conserva el token en memoria', () => {
    bloquear('setItem')
    const almacen = new SesionLocalStorage()

    almacen.guardarToken('jwt')

    expect(almacen.obtenerToken()).toBe('jwt')
  })

  it('si todo está bloqueado funciona en memoria y no lanza errores', () => {
    bloquear('getItem')
    bloquear('setItem')
    bloquear('removeItem')
    const almacen = new SesionLocalStorage()

    almacen.guardarToken('jwt')
    expect(almacen.obtenerToken()).toBe('jwt')

    almacen.borrarToken()
    expect(almacen.obtenerToken()).toBeNull()
  })
})
