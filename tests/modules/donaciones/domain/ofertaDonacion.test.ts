import { describe, expect, it } from 'vitest'
import { validarOferta } from '@/modules/donaciones/domain/ofertaDonacion.ts'
import type { DatosNuevaOferta, InsumoOfertado } from '@/modules/donaciones/domain/ofertaDonacion.ts'

const HOY = '2026-11-04'

function lenteja(): InsumoOfertado {
  return {
    nombre: 'Lenteja Seleccionada Nacional',
    categoria: 'Abarrotes secos',
    presentacion: '120 bolsas x 500 g en fardos',
    cantidad: 120,
    unidadEmpaque: 'BOLSA',
    peso: 60,
    unidadMedida: 'KG',
    fechaVencimiento: '2027-01-28',
  }
}

function ofertaValida(): DatosNuevaOferta {
  return {
    insumos: [lenteja()],
    logistica: { fechaEntrega: '2026-11-05', horaLlegada: '10:00', transporte: 'VEHICULO_PROPIO' },
    observaciones: '',
  }
}

describe('validarOferta', () => {
  it('acepta una oferta con insumos y logística completa', () => {
    expect(validarOferta(ofertaValida(), HOY)).toBeNull()
  })

  it('acepta una entrega para hoy y sin hora de llegada', () => {
    const oferta = ofertaValida()
    oferta.logistica = { ...oferta.logistica, fechaEntrega: HOY, horaLlegada: null }
    expect(validarOferta(oferta, HOY)).toBeNull()
  })

  it('rechaza una oferta sin insumos', () => {
    expect(validarOferta({ ...ofertaValida(), insumos: [] }, HOY)).toBe('Agrega al menos un insumo a la oferta.')
  })

  it('rechaza una oferta sin fecha de entrega', () => {
    const oferta = ofertaValida()
    oferta.logistica = { ...oferta.logistica, fechaEntrega: '' }
    expect(validarOferta(oferta, HOY)).toBe('Elige la fecha de entrega.')
  })

  it('rechaza una fecha de entrega en el pasado', () => {
    const oferta = ofertaValida()
    oferta.logistica = { ...oferta.logistica, fechaEntrega: '2026-11-03' }
    expect(validarOferta(oferta, HOY)).toBe('La fecha de entrega no puede ser anterior a hoy.')
  })

  it('rechaza una oferta sin modalidad de transporte', () => {
    const oferta = ofertaValida()
    oferta.logistica = { ...oferta.logistica, transporte: null }
    expect(validarOferta(oferta, HOY)).toBe('Elige cómo llegará la donación al comedor.')
  })

  it('rechaza un insumo que vence antes de la fecha de entrega', () => {
    const oferta = { ...ofertaValida(), insumos: [{ ...lenteja(), fechaVencimiento: '2026-11-05' }] }
    expect(validarOferta(oferta, HOY)).toBe(
      'El insumo "Lenteja Seleccionada Nacional" estaría vencido al llegar al comedor.',
    )
  })

  it('rechaza una cantidad en cero o con decimales', () => {
    const mensaje = 'La cantidad de cada insumo debe ser un número entero mayor a 0.'
    expect(validarOferta({ ...ofertaValida(), insumos: [{ ...lenteja(), cantidad: 0 }] }, HOY)).toBe(mensaje)
    expect(validarOferta({ ...ofertaValida(), insumos: [{ ...lenteja(), cantidad: 2.5 }] }, HOY)).toBe(mensaje)
  })
})
