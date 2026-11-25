import { describe, expect, it } from 'vitest'
import {
  JornadaNoDisponible,
  esJornadaNoDisponible,
} from '@/modules/turnos/domain/JornadaNoDisponible.ts'
import { TurnoYaEntregado, esTurnoYaEntregado } from '@/modules/turnos/domain/TurnoYaEntregado.ts'
import { TURNO_JORGE } from '../datosDePrueba.ts'

describe('TurnoYaEntregado', () => {
  it('guarda el turno que la persona ya tenía', () => {
    const error = new TurnoYaEntregado(TURNO_JORGE)

    expect(esTurnoYaEntregado(error)).toBe(true)
    expect(error.turno).toBe(TURNO_JORGE)
  })

  it('no confunde otros errores con un turno ya entregado', () => {
    expect(esTurnoYaEntregado(new Error('otro'))).toBe(false)
    expect(esTurnoYaEntregado(new JornadaNoDisponible())).toBe(false)
  })
})

describe('JornadaNoDisponible', () => {
  it('se reconoce por su tipo', () => {
    expect(esJornadaNoDisponible(new JornadaNoDisponible())).toBe(true)
    expect(esJornadaNoDisponible(new Error('otro'))).toBe(false)
  })
})
