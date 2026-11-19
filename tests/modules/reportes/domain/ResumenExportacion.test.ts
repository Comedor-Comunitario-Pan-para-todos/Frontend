import { describe, expect, it } from 'vitest'
import {
  hayPersonasParaExportar,
  nombreDelPadron,
} from '@/modules/reportes/domain/ResumenExportacion.ts'

describe('hayPersonasParaExportar', () => {
  it('solo hay archivo si alguien autorizó el reporte', () => {
    expect(hayPersonasParaExportar({ asistieron: 10, incluidas: 8, excluidas: 2 })).toBe(true)
    expect(hayPersonasParaExportar({ asistieron: 3, incluidas: 0, excluidas: 3 })).toBe(false)
    expect(hayPersonasParaExportar({ asistieron: 0, incluidas: 0, excluidas: 0 })).toBe(false)
  })
})

describe('nombreDelPadron', () => {
  it('lleva las fechas del rango', () => {
    expect(nombreDelPadron({ desde: '2026-11-01', hasta: '2026-11-19' })).toBe(
      'padron-beneficiarios_2026-11-01_a_2026-11-19.xlsx',
    )
  })
})
