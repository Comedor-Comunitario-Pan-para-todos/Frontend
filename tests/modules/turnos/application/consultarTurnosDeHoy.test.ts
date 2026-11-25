import { describe, expect, it, vi } from 'vitest'
import { crearConsultarTurnosDeHoy } from '@/modules/turnos/application/consultarTurnosDeHoy.ts'
import type { TurnosRepository } from '@/modules/turnos/application/ports/TurnosRepository.ts'
import { TURNO_CARLOS, TURNO_JORGE, TURNO_LUZ } from '../datosDePrueba.ts'

describe('consultarTurnosDeHoy', () => {
  it('devuelve los turnos de hoy con el último entregado de primero', async () => {
    const repositorio: TurnosRepository = {
      consultarDeHoy: vi.fn().mockResolvedValue([TURNO_CARLOS, TURNO_JORGE, TURNO_LUZ]),
      entregar: vi.fn(),
    }

    const turnos = await crearConsultarTurnosDeHoy({ repositorio })()

    expect(turnos).toEqual([TURNO_JORGE, TURNO_LUZ, TURNO_CARLOS])
  })
})
