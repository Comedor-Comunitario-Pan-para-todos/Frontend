import { describe, expect, it, vi } from 'vitest'
import { crearEntregarTurno } from '@/modules/turnos/application/entregarTurno.ts'
import type { TurnosRepository } from '@/modules/turnos/application/ports/TurnosRepository.ts'
import { TurnoYaEntregado } from '@/modules/turnos/domain/TurnoYaEntregado.ts'
import { TURNO_JORGE } from '../datosDePrueba.ts'

function repositorioQueEntrega(entregar: TurnosRepository['entregar']): TurnosRepository {
  return { consultarDeHoy: vi.fn(), entregar }
}

describe('entregarTurno', () => {
  it('entrega el turno a la persona y devuelve el que asignó el servidor', async () => {
    const repositorio = repositorioQueEntrega(vi.fn().mockResolvedValue(TURNO_JORGE))

    const turno = await crearEntregarTurno({ repositorio })('ben-jorge')

    expect(turno).toBe(TURNO_JORGE)
    expect(repositorio.entregar).toHaveBeenCalledWith('ben-jorge')
  })

  it('deja pasar el aviso de que la persona ya tenía turno', async () => {
    const yaEntregado = new TurnoYaEntregado(TURNO_JORGE)
    const repositorio = repositorioQueEntrega(vi.fn().mockRejectedValue(yaEntregado))

    await expect(crearEntregarTurno({ repositorio })('ben-jorge')).rejects.toBe(yaEntregado)
  })
})
