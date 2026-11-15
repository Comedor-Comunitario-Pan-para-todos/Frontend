import { describe, expect, it } from 'vitest'
import { crearCompletarDatosExtendidos } from '@/modules/beneficiarios/application/completarDatosExtendidos.ts'
import { crearRepositorioDePrueba, MARIA } from '../datosDePrueba.ts'

describe('completarDatosExtendidos', () => {
  it('envía los datos limpios y devuelve la ficha', async () => {
    const repositorio = crearRepositorioDePrueba()

    const ficha = await crearCompletarDatosExtendidos({ repositorio })(MARIA.id, {
      documento: { tipo: 'CC', numero: '42.185.390' },
      telefono: '315 123 4567',
      clasificacion: { sistema: 'RUI', grupo: 'C12' },
    })

    expect(ficha).toEqual(MARIA)
    expect(repositorio.completarDatosExtendidos).toHaveBeenCalledWith(MARIA.id, {
      documento: { tipo: 'CC', numero: '42185390' },
      telefono: '3151234567',
      clasificacion: { sistema: 'RUI', grupo: 'C12' },
    })
  })
})
