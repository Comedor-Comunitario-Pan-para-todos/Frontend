import { describe, expect, it } from 'vitest'
import {
  calcularAvance,
  conLectura,
  estaLeido,
  modulosEnOrden,
  primerTemaPendiente,
} from '@/modules/induccion/domain/avanceInduccion.ts'
import { EMERGENCIAS, guiaCon, HIGIENE, TRATO_DIGNO } from '../datosDePrueba.ts'

describe('calcularAvance', () => {
  it('cuenta los temas leídos y los minutos que faltan', () => {
    expect(calcularAvance(guiaCon(['higiene']))).toEqual({
      leidos: 1,
      total: 3,
      minutosRestantes: 5,
      completa: false,
    })
  })

  it('está completa cuando leyó todos los temas', () => {
    const avance = calcularAvance(guiaCon(['higiene', 'trato-digno', 'emergencias']))

    expect(avance.completa).toBe(true)
    expect(avance.minutosRestantes).toBe(0)
  })

  it('no cuenta temas leídos que ya no están en la guía', () => {
    expect(calcularAvance(guiaCon(['higiene', 'tema-retirado'])).leidos).toBe(1)
  })

  it('una guía sin temas no está completa', () => {
    const avance = calcularAvance({ modulos: [], progreso: { modulosLeidos: [] } })

    expect(avance).toEqual({ leidos: 0, total: 0, minutosRestantes: 0, completa: false })
  })
})

describe('primerTemaPendiente', () => {
  it('es el primer tema, en orden, que falta por leer', () => {
    expect(primerTemaPendiente(guiaCon(['higiene']))).toBe(TRATO_DIGNO)
  })

  it('respeta el orden aunque la API los mande desordenados', () => {
    const guia = { modulos: [EMERGENCIAS, TRATO_DIGNO, HIGIENE], progreso: { modulosLeidos: [] } }

    expect(primerTemaPendiente(guia)).toBe(HIGIENE)
  })

  it('no hay tema pendiente si ya leyó todo', () => {
    expect(primerTemaPendiente(guiaCon(['higiene', 'trato-digno', 'emergencias']))).toBeNull()
  })
})

describe('modulosEnOrden', () => {
  it('ordena por el número de orden sin cambiar la lista original', () => {
    const original = [EMERGENCIAS, HIGIENE, TRATO_DIGNO]

    expect(modulosEnOrden(original)).toEqual([HIGIENE, TRATO_DIGNO, EMERGENCIAS])
    expect(original[0]).toBe(EMERGENCIAS)
  })
})

describe('conLectura', () => {
  it('marca un tema como leído', () => {
    const progreso = conLectura({ modulosLeidos: ['higiene'] }, 'trato-digno', true)

    expect(progreso.modulosLeidos).toEqual(['higiene', 'trato-digno'])
  })

  it('no repite un tema que ya estaba leído', () => {
    expect(conLectura({ modulosLeidos: ['higiene'] }, 'higiene', true).modulosLeidos).toEqual([
      'higiene',
    ])
  })

  it('desmarca un tema', () => {
    const progreso = conLectura({ modulosLeidos: ['higiene', 'trato-digno'] }, 'higiene', false)

    expect(estaLeido(progreso, 'higiene')).toBe(false)
    expect(progreso.modulosLeidos).toEqual(['trato-digno'])
  })
})
