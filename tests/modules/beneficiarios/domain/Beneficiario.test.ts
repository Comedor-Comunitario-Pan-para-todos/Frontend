import { describe, expect, it } from 'vitest'
import {
  iniciales,
  limpiarNuevoBeneficiario,
  nombreCompleto,
  type NuevoBeneficiario,
} from '@/modules/beneficiarios/domain/Beneficiario.ts'

const DATOS: NuevoBeneficiario = {
  nombres: 'María Elena',
  apellidos: 'Restrepo',
  documento: { tipo: 'CC', numero: '42185390' },
  fechaNacimiento: '1958-03-15',
  barrio: 'El Poblado',
}

describe('limpiarNuevoBeneficiario', () => {
  it('deja igual unos datos que ya están limpios', () => {
    expect(limpiarNuevoBeneficiario(DATOS)).toEqual(DATOS)
  })

  it('quita los espacios sobrantes de nombres, apellidos y barrio', () => {
    const limpio = limpiarNuevoBeneficiario({
      ...DATOS,
      nombres: '  María   Elena ',
      apellidos: ' Restrepo  ',
      barrio: ' El   Poblado ',
    })

    expect(limpio).toEqual(DATOS)
  })

  it('guarda el documento sin puntos ni espacios', () => {
    const limpio = limpiarNuevoBeneficiario({
      ...DATOS,
      documento: { tipo: 'CC', numero: ' 42.185.390 ' },
    })

    expect(limpio.documento).toEqual({ tipo: 'CC', numero: '42185390' })
  })

  it.each(['', '   ', '..'])('un documento sin número ("%s") cuenta como sin documento', (n) => {
    const limpio = limpiarNuevoBeneficiario({ ...DATOS, documento: { tipo: 'CC', numero: n } })

    expect(limpio.documento).toBeNull()
  })

  it('conserva a la persona sin documento', () => {
    expect(limpiarNuevoBeneficiario({ ...DATOS, documento: null }).documento).toBeNull()
  })

  it.each([null, '', '   '])('un barrio vacío (%j) queda en null', (barrio) => {
    expect(limpiarNuevoBeneficiario({ ...DATOS, barrio }).barrio).toBeNull()
  })
})

describe('nombreCompleto', () => {
  it('une nombres y apellidos', () => {
    expect(nombreCompleto({ nombres: 'María Elena', apellidos: 'Restrepo' })).toBe(
      'María Elena Restrepo',
    )
  })

  it('quita los espacios sobrantes', () => {
    expect(nombreCompleto({ nombres: '  Carlos   Julio ', apellidos: ' Morales  Restrepo ' })).toBe(
      'Carlos Julio Morales Restrepo',
    )
  })

  it('sin apellidos devuelve solo los nombres', () => {
    expect(nombreCompleto({ nombres: 'Rosa', apellidos: '' })).toBe('Rosa')
  })
})

describe('iniciales', () => {
  it('toma la primera letra del nombre y del apellido', () => {
    expect(iniciales({ nombres: 'María Elena', apellidos: 'Restrepo' })).toBe('MR')
  })

  it('las devuelve en mayúscula e ignora los espacios iniciales', () => {
    expect(iniciales({ nombres: ' ángela', apellidos: ' ospina' })).toBe('ÁO')
  })

  it('sin apellidos devuelve una sola letra', () => {
    expect(iniciales({ nombres: 'Rosa', apellidos: '' })).toBe('R')
  })
})
