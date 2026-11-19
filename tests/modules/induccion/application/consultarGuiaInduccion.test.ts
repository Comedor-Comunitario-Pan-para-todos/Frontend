import { describe, expect, it, vi } from 'vitest'
import { crearConsultarGuiaInduccion } from '@/modules/induccion/application/consultarGuiaInduccion.ts'
import type { InduccionRepository } from '@/modules/induccion/application/ports/InduccionRepository.ts'
import { EMERGENCIAS, HIGIENE, TRATO_DIGNO } from '../datosDePrueba.ts'

describe('consultarGuiaInduccion', () => {
  it('devuelve la guía con los temas en orden y el progreso tal cual', async () => {
    const progreso = { modulosLeidos: ['higiene'] }
    const repositorio: InduccionRepository = {
      consultar: vi
        .fn()
        .mockResolvedValue({ modulos: [EMERGENCIAS, HIGIENE, TRATO_DIGNO], progreso }),
      registrarLectura: vi.fn(),
    }

    const guia = await crearConsultarGuiaInduccion({ repositorio })()

    expect(guia.modulos).toEqual([HIGIENE, TRATO_DIGNO, EMERGENCIAS])
    expect(guia.progreso).toBe(progreso)
  })
})
