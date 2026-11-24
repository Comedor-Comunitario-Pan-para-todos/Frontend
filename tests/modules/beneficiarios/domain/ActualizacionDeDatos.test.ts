import { describe, expect, it } from 'vitest'
import {
  limpiarActualizacion,
  type ActualizacionDeDatos,
} from '@/modules/beneficiarios/domain/ActualizacionDeDatos.ts'

const BASICA: ActualizacionDeDatos = {
  nombres: 'María Elena',
  apellidos: 'Restrepo',
  fechaNacimiento: '1958-03-15',
  barrio: 'El Poblado',
  sensibles: null,
}

describe('limpiarActualizacion', () => {
  it('quita los espacios sobrantes y deja el barrio vacío en null', () => {
    const limpia = limpiarActualizacion({
      ...BASICA,
      nombres: '  María   Elena ',
      apellidos: ' Restrepo ',
      barrio: '   ',
    })

    expect(limpia).toEqual({ ...BASICA, barrio: null })
  })

  it('sin datos sensibles los deja sin tocar', () => {
    expect(limpiarActualizacion(BASICA).sensibles).toBeNull()
  })

  it('limpia los datos sensibles cuando vienen', () => {
    const limpia = limpiarActualizacion({
      ...BASICA,
      sensibles: {
        documento: { tipo: 'CC', numero: '42.185.390' },
        telefono: '315 123 4567',
        clasificacion: null,
      },
    })

    expect(limpia.sensibles).toEqual({
      documento: { tipo: 'CC', numero: '42185390' },
      telefono: '3151234567',
      clasificacion: null,
    })
  })
})
