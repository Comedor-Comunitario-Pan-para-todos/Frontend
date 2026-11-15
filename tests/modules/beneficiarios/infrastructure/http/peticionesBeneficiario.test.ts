import { describe, expect, it } from 'vitest'
import type { NuevoBeneficiarioExtendido } from '@/modules/beneficiarios/domain/NuevoBeneficiario.ts'
import {
  aCuerpoDeDatosExtendidos,
  aCuerpoDeRegistro,
  aParametrosDeBusqueda,
} from '@/modules/beneficiarios/infrastructure/http/peticionesBeneficiario.ts'

const BASICOS = {
  nombres: 'María Elena',
  apellidos: 'Restrepo',
  fechaNacimiento: '1958-03-15',
  barrio: 'El Poblado',
}

const EXTENDIDA: NuevoBeneficiarioExtendido = {
  ...BASICOS,
  nivel: 'EXTENDIDO',
  documento: { tipo: 'CC', numero: '42185390' },
  telefono: '3151234567',
  clasificacion: { sistema: 'RUI', grupo: 'B3' },
}

describe('aCuerpoDeRegistro', () => {
  it('en nivel básico solo lleva los datos básicos', () => {
    expect(aCuerpoDeRegistro({ ...BASICOS, nivel: 'BASICO' })).toEqual({
      ...BASICOS,
      nivel: 'BASICO',
    })
  })

  it('en nivel extendido usa los nombres de campo del backend', () => {
    expect(aCuerpoDeRegistro(EXTENDIDA)).toEqual({
      ...BASICOS,
      nivel: 'EXTENDIDO',
      tipoDocumento: 'CC',
      numeroDocumento: '42185390',
      telefono: '3151234567',
      clasificacion: { sistema: 'RUI', grupo: 'B3' },
    })
  })

  it('no envía lo que está vacío', () => {
    const cuerpo = aCuerpoDeRegistro({
      ...EXTENDIDA,
      barrio: null,
      documento: null,
      telefono: null,
      clasificacion: null,
    })

    expect(JSON.parse(JSON.stringify(cuerpo))).toEqual({
      nivel: 'EXTENDIDO',
      nombres: 'María Elena',
      apellidos: 'Restrepo',
      fechaNacimiento: '1958-03-15',
    })
  })
})

describe('aCuerpoDeDatosExtendidos', () => {
  it('pasa a nivel extendido con solo los datos sensibles', () => {
    expect(aCuerpoDeDatosExtendidos(EXTENDIDA)).toEqual({
      nivel: 'EXTENDIDO',
      tipoDocumento: 'CC',
      numeroDocumento: '42185390',
      telefono: '3151234567',
      clasificacion: { sistema: 'RUI', grupo: 'B3' },
    })
  })
})

describe('aParametrosDeBusqueda', () => {
  it('traduce los criterios a search, page y limit', () => {
    expect(aParametrosDeBusqueda({ texto: 'Restrepo', pagina: 2, porPagina: 20 })).toEqual({
      search: 'Restrepo',
      page: 2,
      limit: 20,
    })
  })

  it('sin texto no envía search', () => {
    expect(aParametrosDeBusqueda({ texto: '', pagina: 1, porPagina: 20 }).search).toBeUndefined()
  })
})
