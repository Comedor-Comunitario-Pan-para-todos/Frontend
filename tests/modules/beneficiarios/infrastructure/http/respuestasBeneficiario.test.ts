import { describe, expect, it } from 'vitest'
import {
  esquemaBeneficiario,
  esquemaPagina,
  esquemaValidacionDocumento,
} from '@/modules/beneficiarios/infrastructure/http/respuestasBeneficiario.ts'
import { CARLOS, MARIA } from '../../datosDePrueba.ts'
import { DTO_CARLOS, DTO_MARIA } from './dtosDePrueba.ts'

describe('esquemaBeneficiario', () => {
  it('traduce la ficha del backend y descarta los campos que no usa', () => {
    expect(esquemaBeneficiario.parse(DTO_MARIA)).toEqual(MARIA)
    expect(esquemaBeneficiario.parse(DTO_CARLOS)).toEqual(CARLOS)
  })

  it('lee el nivel y la clasificación cuando llegan', () => {
    const ficha = esquemaBeneficiario.parse({
      ...DTO_CARLOS,
      nivel: 'EXTENDIDO',
      clasificacion: { sistema: 'SISBEN_IV', grupo: 'C12' },
    })

    expect(ficha).toMatchObject({
      nivel: 'EXTENDIDO',
      clasificacion: { sistema: 'SISBEN_IV', grupo: 'C12' },
    })
  })

  it('sin nivel, quien tiene teléfono cuenta como extendido', () => {
    expect(esquemaBeneficiario.parse({ ...DTO_CARLOS, telefono: '3151234567' }).nivel).toBe(
      'EXTENDIDO',
    )
  })

  it.each([
    ['un sistema desconocido', { sistema: 'SISBEN_III', grupo: 'A1' }],
    ['un grupo fuera de la escala', { sistema: 'RUI', grupo: 'E1' }],
    ['otra forma', 'A1'],
  ])('ignora una clasificación con %s sin rechazar la ficha', (_, clasificacion) => {
    expect(esquemaBeneficiario.parse({ ...DTO_MARIA, clasificacion }).clasificacion).toBeNull()
  })

  it('conserva solo el día si la fecha de nacimiento llega con hora', () => {
    const ficha = esquemaBeneficiario.parse({
      ...DTO_MARIA,
      fechaNacimiento: '1958-03-15T00:00:00.000Z',
    })

    expect(ficha.fechaNacimiento).toBe('1958-03-15')
  })

  it('acepta un tipo de documento que la app no conoce', () => {
    expect(esquemaBeneficiario.parse({ ...DTO_MARIA, tipoDocumento: 'CE' }).documento).toEqual({
      tipo: 'CE',
      numero: '42185390',
    })
  })

  it('rechaza una ficha sin fecha de nacimiento', () => {
    expect(esquemaBeneficiario.safeParse({ ...DTO_MARIA, fechaNacimiento: null }).success).toBe(
      false,
    )
  })
})

describe('esquemaPagina', () => {
  it('traduce la página y sus totales', () => {
    const pagina = esquemaPagina.parse({
      data: [DTO_MARIA, DTO_CARLOS],
      meta: { total: 41, page: 2, limit: 20, totalPages: 3 },
    })

    expect(pagina).toEqual({
      beneficiarios: [MARIA, CARLOS],
      total: 41,
      pagina: 2,
      totalPaginas: 3,
    })
  })
})

describe('esquemaValidacionDocumento', () => {
  it('devuelve a quien tiene el documento, o null', () => {
    expect(esquemaValidacionDocumento.parse({ existe: true, beneficiario: DTO_MARIA })).toEqual(
      MARIA,
    )
    expect(esquemaValidacionDocumento.parse({ existe: false, beneficiario: null })).toBeNull()
  })
})
