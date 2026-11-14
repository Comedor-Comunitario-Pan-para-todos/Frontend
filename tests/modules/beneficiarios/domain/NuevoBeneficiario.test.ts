import { describe, expect, it } from 'vitest'
import {
  limpiarDatosExtendidos,
  limpiarNuevoBeneficiario,
  type NuevoBeneficiario,
  type NuevoBeneficiarioExtendido,
} from '@/modules/beneficiarios/domain/NuevoBeneficiario.ts'

const DATOS: NuevoBeneficiarioExtendido = {
  nivel: 'EXTENDIDO',
  nombres: 'María Elena',
  apellidos: 'Restrepo',
  documento: { tipo: 'CC', numero: '42185390' },
  fechaNacimiento: '1958-03-15',
  barrio: 'El Poblado',
  telefono: '3151234567',
  clasificacion: { sistema: 'RUI', grupo: 'B3' },
}

const BASICOS: NuevoBeneficiario = {
  nivel: 'BASICO',
  nombres: 'María Elena',
  apellidos: 'Restrepo',
  fechaNacimiento: '1958-03-15',
  barrio: 'El Poblado',
}

describe('limpiarNuevoBeneficiario', () => {
  it('deja igual unos datos que ya están limpios', () => {
    expect(limpiarNuevoBeneficiario(DATOS)).toEqual(DATOS)
    expect(limpiarNuevoBeneficiario(BASICOS)).toEqual(BASICOS)
  })

  it('quita los espacios sobrantes de nombres, apellidos y barrio', () => {
    const limpio = limpiarNuevoBeneficiario({
      ...BASICOS,
      nombres: '  María   Elena ',
      apellidos: ' Restrepo  ',
      barrio: ' El   Poblado ',
    })

    expect(limpio).toEqual(BASICOS)
  })

  it.each([null, '', '   '])('un barrio vacío (%j) queda en null', (barrio) => {
    expect(limpiarNuevoBeneficiario({ ...BASICOS, barrio }).barrio).toBeNull()
  })

  it('en el nivel básico no deja pasar datos sensibles aunque lleguen', () => {
    const conSobrantes = { ...DATOS, nivel: 'BASICO' } as NuevoBeneficiario

    expect(limpiarNuevoBeneficiario(conSobrantes)).toEqual(BASICOS)
  })

  it('en el nivel extendido limpia también los datos sensibles', () => {
    const limpio = limpiarNuevoBeneficiario({
      ...DATOS,
      documento: { tipo: 'CC', numero: ' 42.185.390 ' },
      telefono: '315 123-4567',
    })

    expect(limpio).toEqual(DATOS)
  })
})

describe('limpiarDatosExtendidos', () => {
  const EXTENDIDOS = {
    documento: DATOS.documento,
    telefono: DATOS.telefono,
    clasificacion: DATOS.clasificacion,
  }

  it('guarda el documento sin puntos ni espacios', () => {
    const limpio = limpiarDatosExtendidos({
      ...EXTENDIDOS,
      documento: { tipo: 'CC', numero: ' 42.185.390 ' },
    })

    expect(limpio.documento).toEqual({ tipo: 'CC', numero: '42185390' })
  })

  it.each(['', '   ', '..'])('un documento sin número ("%s") cuenta como sin documento', (n) => {
    const limpio = limpiarDatosExtendidos({ ...EXTENDIDOS, documento: { tipo: 'CC', numero: n } })

    expect(limpio.documento).toBeNull()
  })

  it('conserva a la persona sin documento', () => {
    expect(limpiarDatosExtendidos({ ...EXTENDIDOS, documento: null }).documento).toBeNull()
  })

  it.each([null, '', ' - '])('un teléfono vacío (%j) queda en null', (telefono) => {
    expect(limpiarDatosExtendidos({ ...EXTENDIDOS, telefono }).telefono).toBeNull()
  })

  it('conserva la clasificación tal como llega', () => {
    expect(limpiarDatosExtendidos(EXTENDIDOS).clasificacion).toEqual({
      sistema: 'RUI',
      grupo: 'B3',
    })
  })
})
