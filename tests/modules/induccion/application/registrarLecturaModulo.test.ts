import { describe, expect, it, vi } from 'vitest'
import type { InduccionRepository } from '@/modules/induccion/application/ports/InduccionRepository.ts'
import { crearRegistrarLecturaModulo } from '@/modules/induccion/application/registrarLecturaModulo.ts'

describe('registrarLecturaModulo', () => {
  it('guarda la lectura y devuelve el progreso que quedó guardado', async () => {
    const guardado = { modulosLeidos: ['higiene', 'trato-digno'] }
    const repositorio: InduccionRepository = {
      consultar: vi.fn(),
      registrarLectura: vi.fn().mockResolvedValue(guardado),
    }

    const progreso = await crearRegistrarLecturaModulo({ repositorio })('trato-digno', true)

    expect(progreso).toBe(guardado)
    expect(repositorio.registrarLectura).toHaveBeenCalledWith('trato-digno', true)
  })
})
