import { describe, expect, it, vi } from 'vitest'
import { crearExportarPadron } from '@/modules/reportes/application/exportarPadron.ts'
import type { DescargaPort } from '@/modules/reportes/application/ports/DescargaPort.ts'
import type {
  ArchivoGenerado,
  ExportacionRepository,
} from '@/modules/reportes/application/ports/ExportacionRepository.ts'
import { RangoInvalido } from '@/modules/reportes/domain/RangoInvalido.ts'

const HOY = '2026-11-19'
const RANGO = { desde: '2026-11-01', hasta: HOY }
const ARCHIVO: ArchivoGenerado = {
  nombre: 'padron.xlsx',
  contenido: new Blob(['PK']),
}

function crear(generarPadron = vi.fn().mockResolvedValue(ARCHIVO)) {
  const repositorio: ExportacionRepository = { consultarResumen: vi.fn(), generarPadron }
  const descarga: DescargaPort = { guardar: vi.fn() }
  const exportar = crearExportarPadron({ repositorio, descarga, hoy: () => HOY })
  return { exportar, repositorio, descarga }
}

describe('exportarPadron', () => {
  it('genera el archivo del rango y lo descarga', async () => {
    const { exportar, repositorio, descarga } = crear()
    const alAvanzar = vi.fn()

    const resultado = await exportar({ rango: RANGO, responsabilidadAceptada: true, alAvanzar })

    expect(resultado).toEqual({ nombre: 'padron.xlsx' })
    expect(repositorio.generarPadron).toHaveBeenCalledWith(RANGO, {
      alAvanzar,
      signal: undefined,
    })
    expect(descarga.guardar).toHaveBeenCalledWith(ARCHIVO)
  })

  it('no pide el archivo si el rango es inválido', async () => {
    const { exportar, repositorio } = crear()

    await expect(
      exportar({ rango: { desde: '', hasta: HOY }, responsabilidadAceptada: true }),
    ).rejects.toBeInstanceOf(RangoInvalido)
    expect(repositorio.generarPadron).not.toHaveBeenCalled()
  })

  it('si el servidor falla no descarga nada', async () => {
    const { exportar, descarga } = crear(vi.fn().mockRejectedValue(new Error('caído')))

    await expect(exportar({ rango: RANGO, responsabilidadAceptada: true })).rejects.toThrow('caído')
    expect(descarga.guardar).not.toHaveBeenCalled()
  })
})
