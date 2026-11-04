import { describe, expect, it } from 'vitest'
import { puedeDecidirseOferta, puedeRecibirseOferta } from '@/modules/donaciones/domain/estadoOferta.ts'

describe('puedeDecidirseOferta', () => {
  it('permite aceptar o rechazar una oferta pendiente', () => {
    expect(puedeDecidirseOferta('PENDIENTE')).toBe(true)
  })

  it('no permite volver a decidir una oferta ya aceptada, rechazada o recibida', () => {
    expect(puedeDecidirseOferta('ACEPTADA')).toBe(false)
    expect(puedeDecidirseOferta('RECHAZADA')).toBe(false)
    expect(puedeDecidirseOferta('RECIBIDA')).toBe(false)
  })
})

describe('puedeRecibirseOferta', () => {
  it('permite registrar la recepción de una oferta aceptada', () => {
    expect(puedeRecibirseOferta('ACEPTADA')).toBe(true)
  })

  it('no permite recibir una oferta pendiente, rechazada o ya recibida', () => {
    expect(puedeRecibirseOferta('PENDIENTE')).toBe(false)
    expect(puedeRecibirseOferta('RECHAZADA')).toBe(false)
    expect(puedeRecibirseOferta('RECIBIDA')).toBe(false)
  })
})
