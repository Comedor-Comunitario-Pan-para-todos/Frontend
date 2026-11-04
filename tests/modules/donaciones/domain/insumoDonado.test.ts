import { describe, expect, it } from 'vitest'
import { sumarPesos, validarInsumo } from '@/modules/donaciones/domain/insumoDonado.ts'
import type { InsumoDonado } from '@/modules/donaciones/domain/insumoDonado.ts'

const LLEGADA = '2026-11-10'

function arroz(): InsumoDonado {
  return {
    nombre: 'Arroz Blanco Diana',
    categoria: 'Abarrotes secos',
    presentacion: 'Bultos de 50 kg sellados',
    peso: 500,
    unidadMedida: 'KG',
    fechaVencimiento: '2026-12-15',
  }
}

describe('validarInsumo', () => {
  it('acepta un insumo completo que vence después de llegar', () => {
    expect(validarInsumo(arroz(), LLEGADA)).toBeNull()
  })

  it('acepta un insumo sin presentación', () => {
    expect(validarInsumo({ ...arroz(), presentacion: null }, LLEGADA)).toBeNull()
  })

  it('rechaza un insumo sin nombre', () => {
    expect(validarInsumo({ ...arroz(), nombre: '  ' }, LLEGADA)).toBe('Escribe el nombre de cada insumo.')
  })

  it('rechaza un insumo sin categoría', () => {
    expect(validarInsumo({ ...arroz(), categoria: '' }, LLEGADA)).toBe('Elige la categoría de cada insumo.')
  })

  it('rechaza un peso en cero, negativo o que no es número', () => {
    const mensaje = 'El peso de cada insumo debe ser mayor a 0.'
    expect(validarInsumo({ ...arroz(), peso: 0 }, LLEGADA)).toBe(mensaje)
    expect(validarInsumo({ ...arroz(), peso: -2 }, LLEGADA)).toBe(mensaje)
    expect(validarInsumo({ ...arroz(), peso: Number.NaN }, LLEGADA)).toBe(mensaje)
  })

  it('rechaza un insumo sin fecha de vencimiento', () => {
    expect(validarInsumo({ ...arroz(), fechaVencimiento: '' }, LLEGADA)).toBe(
      'Indica la fecha de vencimiento de cada insumo.',
    )
  })

  it('rechaza un insumo que vence el mismo día que llega', () => {
    expect(validarInsumo({ ...arroz(), fechaVencimiento: LLEGADA }, LLEGADA)).toBe(
      'El insumo "Arroz Blanco Diana" estaría vencido al llegar al comedor.',
    )
  })

  it('rechaza un insumo que vence antes de llegar', () => {
    expect(validarInsumo({ ...arroz(), fechaVencimiento: '2026-10-28' }, LLEGADA)).toBe(
      'El insumo "Arroz Blanco Diana" estaría vencido al llegar al comedor.',
    )
  })
})

describe('sumarPesos', () => {
  it('suma por separado los kilos y los litros', () => {
    const total = sumarPesos([
      { peso: 50, unidadMedida: 'KG' },
      { peso: 25, unidadMedida: 'KG' },
      { peso: 12, unidadMedida: 'L' },
    ])
    expect(total).toEqual({ kg: 75, litros: 12 })
  })

  it('devuelve cero cuando no hay insumos', () => {
    expect(sumarPesos([])).toEqual({ kg: 0, litros: 0 })
  })
})
