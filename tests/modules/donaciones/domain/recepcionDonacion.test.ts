import { describe, expect, it } from 'vitest'
import { validarRecepcion } from '@/modules/donaciones/domain/recepcionDonacion.ts'
import type { DatosRecepcion } from '@/modules/donaciones/domain/recepcionDonacion.ts'

const HOY = '2026-11-04'

function recepcionValida(): DatosRecepcion {
  return {
    ofertaId: 83,
    donante: { nombre: 'Supermercado Éxito Pereira', nit: null, contacto: 'Hernán' },
    insumos: [
      {
        nombre: 'Aceite vegetal',
        categoria: 'Abarrotes',
        presentacion: '1 caja x 12 unidades (1 L c/u)',
        peso: 12,
        unidadMedida: 'L',
        fechaVencimiento: '2027-03-10',
      },
    ],
    tipoPeso: 'MEDIDO',
  }
}

describe('validarRecepcion', () => {
  it('acepta una recepción con peso medido con báscula', () => {
    expect(validarRecepcion(recepcionValida(), HOY)).toBeNull()
  })

  it('acepta una recepción con peso estimado', () => {
    expect(validarRecepcion({ ...recepcionValida(), tipoPeso: 'ESTIMADO' }, HOY)).toBeNull()
  })

  it('acepta una donación espontánea, sin oferta previa', () => {
    const espontanea = { ...recepcionValida(), ofertaId: null, donante: { nombre: 'Doña Rosa', nit: null, contacto: null } }
    expect(validarRecepcion(espontanea, HOY)).toBeNull()
  })

  it('no deja guardar sin decir si el peso fue medido o estimado', () => {
    expect(validarRecepcion({ ...recepcionValida(), tipoPeso: null }, HOY)).toBe(
      'Indica si el peso fue medido con báscula o estimado.',
    )
  })

  it('no deja guardar sin nombre del donante', () => {
    const recepcion = { ...recepcionValida(), donante: { nombre: '', nit: null, contacto: null } }
    expect(validarRecepcion(recepcion, HOY)).toBe('Escribe el nombre del donante.')
  })

  it('no deja guardar sin insumos', () => {
    expect(validarRecepcion({ ...recepcionValida(), insumos: [] }, HOY)).toBe('Agrega al menos un insumo recibido.')
  })

  it('no deja recibir un insumo que vence hoy', () => {
    const recepcion = recepcionValida()
    recepcion.insumos = [{ ...recepcion.insumos[0], fechaVencimiento: HOY }]
    expect(validarRecepcion(recepcion, HOY)).toBe('El insumo "Aceite vegetal" estaría vencido al llegar al comedor.')
  })
})
