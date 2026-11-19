import { describe, expect, it, vi } from 'vitest'
import { crearConsultarResumenExportacion } from '@/modules/reportes/application/consultarResumenExportacion.ts'
import type { ExportacionRepository } from '@/modules/reportes/application/ports/ExportacionRepository.ts'
import { RangoInvalido } from '@/modules/reportes/domain/RangoInvalido.ts'

const HOY = '2026-11-19'
const RESUMEN = { asistieron: 24, incluidas: 20, excluidas: 4 }

function crearRepositorio(): ExportacionRepository {
  return {
    consultarResumen: vi.fn().mockResolvedValue(RESUMEN),
    generarPadron: vi.fn(),
  }
}

describe('consultarResumenExportacion', () => {
  it('pregunta al servidor por el rango', async () => {
    const repositorio = crearRepositorio()
    const consultar = crearConsultarResumenExportacion({ repositorio, hoy: () => HOY })
    const rango = { desde: '2026-11-01', hasta: HOY }
    const signal = new AbortController().signal

    await expect(consultar(rango, signal)).resolves.toEqual(RESUMEN)
    expect(repositorio.consultarResumen).toHaveBeenCalledWith(rango, signal)
  })

  it('no consulta un rango inválido', async () => {
    const repositorio = crearRepositorio()
    const consultar = crearConsultarResumenExportacion({ repositorio, hoy: () => HOY })

    const resultado = consultar({ desde: '2026-11-10', hasta: '2026-11-01' })

    await expect(resultado).rejects.toBeInstanceOf(RangoInvalido)
    await expect(resultado).rejects.toMatchObject({ errores: { desde: 'posterior-a-hasta' } })
    expect(repositorio.consultarResumen).not.toHaveBeenCalled()
  })
})
