import { describe, expect, it } from 'vitest'
import {
  formatearNumeroTurno,
  recientesPrimero,
  turnoDeLaPersona,
} from '@/modules/turnos/domain/turnosDelDia.ts'
import { TURNO_CARLOS, TURNO_JORGE, TURNO_LUZ } from '../datosDePrueba.ts'

describe('formatearNumeroTurno', () => {
  it('completa con ceros hasta tres cifras', () => {
    expect(formatearNumeroTurno(1)).toBe('#001')
    expect(formatearNumeroTurno(43)).toBe('#043')
  })

  it('no recorta los números de más de tres cifras', () => {
    expect(formatearNumeroTurno(1000)).toBe('#1000')
  })
})

describe('recientesPrimero', () => {
  it('pone primero el número más alto sin cambiar la lista original', () => {
    const original = [TURNO_CARLOS, TURNO_JORGE, TURNO_LUZ]

    expect(recientesPrimero(original)).toEqual([TURNO_JORGE, TURNO_LUZ, TURNO_CARLOS])
    expect(original[0]).toBe(TURNO_CARLOS)
  })
})

describe('turnoDeLaPersona', () => {
  it('encuentra el turno que la persona ya recibió hoy', () => {
    expect(turnoDeLaPersona([TURNO_JORGE, TURNO_LUZ], 'ben-luz')).toBe(TURNO_LUZ)
  })

  it('no hay turno si la persona todavía no ha recibido uno', () => {
    expect(turnoDeLaPersona([TURNO_JORGE, TURNO_LUZ], 'ben-maria')).toBeNull()
  })
})
