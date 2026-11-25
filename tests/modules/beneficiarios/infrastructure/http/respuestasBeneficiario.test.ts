import { describe, expect, it } from 'vitest'
import {
  esquemaBarrios,
  esquemaBeneficiario,
  esquemaPagina,
  esquemaValidacionDocumento,
} from '@/modules/beneficiarios/infrastructure/http/respuestasBeneficiario.ts'
import { TUTOR_ACTIVO, TUTOR_REVOCADO } from '../../consentimientosDePrueba.ts'
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

  it('lee el consentimiento cuando llega y lo deja pendiente cuando no', () => {
    const ficha = esquemaBeneficiario.parse({
      ...DTO_CARLOS,
      consentimiento: {
        id: 'c-1',
        versionPolitica: 1,
        finalidad: 'ATENCION_ALIMENTARIA',
        registradoPor: { id: 'u-1', nombreCompleto: 'Voluntario de Prueba' },
        createdAt: '2026-11-19T15:00:00.000Z',
      },
    })

    expect(ficha.consentimiento).toEqual({
      versionPolitica: 1,
      finalidad: 'ATENCION_ALIMENTARIA',
      registradoEn: '2026-11-19T15:00:00.000Z',
      registradoPor: 'Voluntario de Prueba',
    })
    expect(esquemaBeneficiario.parse(DTO_CARLOS).consentimiento).toBeNull()
  })

  it('un consentimiento que no se puede leer cuenta como pendiente, sin rechazar la ficha', () => {
    const ficha = esquemaBeneficiario.parse({
      ...DTO_CARLOS,
      consentimiento: { versionPolitica: 'uno' },
    })

    expect(ficha.consentimiento).toBeNull()
  })

  it('lee la autorización de imagen cuando llega y la deja bloqueada cuando no', () => {
    const ficha = esquemaBeneficiario.parse({
      ...DTO_CARLOS,
      consentimientoImagen: {
        id: 'c-2',
        versionPolitica: 1,
        finalidad: 'USO_IMAGEN',
        registradoPor: { id: 'u-1', nombreCompleto: 'Voluntario de Prueba' },
        createdAt: '2026-11-20T15:00:00.000Z',
      },
    })

    expect(ficha.consentimientoImagen).toEqual({
      versionPolitica: 1,
      finalidad: 'USO_IMAGEN',
      registradoEn: '2026-11-20T15:00:00.000Z',
      registradoPor: 'Voluntario de Prueba',
    })
    expect(ficha.consentimiento).toBeNull()
    expect(esquemaBeneficiario.parse(DTO_CARLOS).consentimientoImagen).toBeNull()
  })

  it('una autorización de imagen que no se puede leer deja la imagen bloqueada', () => {
    const ficha = esquemaBeneficiario.parse({
      ...DTO_CARLOS,
      consentimientoImagen: { finalidad: 'USO_IMAGEN' },
    })

    expect(ficha.consentimientoImagen).toBeNull()
  })

  describe('autorización del tutor', () => {
    const DTO_TUTOR = {
      id: 'at-1',
      estado: 'ACTIVA',
      tutor: {
        nombre: 'Luz Marina Díaz',
        tipoDocumento: 'CC',
        numeroDocumento: '52123456',
        parentesco: 'MADRE',
        telefono: '3101234567',
      },
      aprobadaPor: { id: 'u-2', nombreCompleto: 'Coordinación de Prueba' },
      fechaAprobacion: '2026-11-18T15:00:00.000Z',
      revocadaEn: null,
      revocadaPor: null,
      motivoRevocacion: null,
    }

    it('la lee cuando llega y la deja en null cuando no', () => {
      expect(
        esquemaBeneficiario.parse({ ...DTO_CARLOS, autorizacionTutor: DTO_TUTOR })
          .autorizacionTutor,
      ).toEqual(TUTOR_ACTIVO)
      expect(esquemaBeneficiario.parse(DTO_CARLOS).autorizacionTutor).toBeNull()
    })

    it('lee quién la revocó, cuándo y por qué', () => {
      const ficha = esquemaBeneficiario.parse({
        ...DTO_CARLOS,
        autorizacionTutor: {
          ...DTO_TUTOR,
          estado: 'REVOCADA',
          revocadaEn: '2026-11-19T10:00:00.000Z',
          revocadaPor: { id: 'u-2', nombreCompleto: 'Coordinación de Prueba' },
          motivoRevocacion: 'El acudiente ya no está a cargo.',
        },
      })

      expect(ficha.autorizacionTutor).toEqual(TUTOR_REVOCADO)
    })

    it('al voluntario le llegan sin documento ni teléfono del tutor', () => {
      const { tipoDocumento: _, numeroDocumento: __, telefono: ___, ...tutor } = DTO_TUTOR.tutor
      const ficha = esquemaBeneficiario.parse({
        ...DTO_CARLOS,
        autorizacionTutor: { ...DTO_TUTOR, tutor },
      })

      expect(ficha.autorizacionTutor?.tutor).toEqual({
        nombre: 'Luz Marina Díaz',
        parentesco: 'MADRE',
        tipoDocumento: null,
        numeroDocumento: null,
        telefono: null,
      })
    })

    it('una que no se puede leer cuenta como que no hay tutor, sin rechazar la ficha', () => {
      const ficha = esquemaBeneficiario.parse({
        ...DTO_CARLOS,
        autorizacionTutor: { ...DTO_TUTOR, estado: 'PENDIENTE' },
      })

      expect(ficha.autorizacionTutor).toBeNull()
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

describe('esquemaBarrios', () => {
  it('quita los espacios sobrantes y descarta los barrios vacíos', () => {
    expect(esquemaBarrios.parse([' Cuba ', '', '   ', 'El Jardín'])).toEqual(['Cuba', 'El Jardín'])
  })
})
