import { describe, expect, it } from 'vitest'
import {
  estadoUsoImagen,
  vencioAlCumplir18,
} from '@/modules/beneficiarios/domain/estadoUsoImagen.ts'
import { AUTORIZACION_IMAGEN, TUTOR_ACTIVO, TUTOR_REVOCADO } from '../consentimientosDePrueba.ts'

const HOY = '2026-11-19'
const ADULTO = '1958-03-15'
const MENOR = '2014-03-15'

function autorizadaEl(registradoEn: string) {
  return { ...AUTORIZACION_IMAGEN, registradoEn }
}

describe('estadoUsoImagen', () => {
  it('sin autorización, a un adulto no se le pueden tomar fotos', () => {
    expect(
      estadoUsoImagen(
        { fechaNacimiento: ADULTO, consentimientoImagen: null, autorizacionTutor: null },
        HOY,
      ),
    ).toBe('NO_AUTORIZADA')
  })

  it('con autorización vigente, se le pueden tomar fotos', () => {
    expect(
      estadoUsoImagen(
        {
          fechaNacimiento: ADULTO,
          consentimientoImagen: AUTORIZACION_IMAGEN,
          autorizacionTutor: null,
        },
        HOY,
      ),
    ).toBe('AUTORIZADA')
  })

  it('a un menor sin autorización le falta la de su tutor', () => {
    expect(
      estadoUsoImagen(
        { fechaNacimiento: MENOR, consentimientoImagen: null, autorizacionTutor: null },
        HOY,
      ),
    ).toBe('REQUIERE_TUTOR')
  })

  it('a un menor le falta la de su tutor aunque tenga una autorización de imagen', () => {
    expect(
      estadoUsoImagen(
        {
          fechaNacimiento: MENOR,
          consentimientoImagen: AUTORIZACION_IMAGEN,
          autorizacionTutor: null,
        },
        HOY,
      ),
    ).toBe('REQUIERE_TUTOR')
  })

  describe('a un menor con su tutor aprobado', () => {
    it('sin autorización de imagen, aún no se le pueden tomar fotos', () => {
      expect(
        estadoUsoImagen(
          { fechaNacimiento: MENOR, consentimientoImagen: null, autorizacionTutor: TUTOR_ACTIVO },
          HOY,
        ),
      ).toBe('NO_AUTORIZADA')
    })

    it('con la autorización de imagen, se le pueden tomar fotos', () => {
      expect(
        estadoUsoImagen(
          {
            fechaNacimiento: MENOR,
            consentimientoImagen: AUTORIZACION_IMAGEN,
            autorizacionTutor: TUTOR_ACTIVO,
          },
          HOY,
        ),
      ).toBe('AUTORIZADA')
    })

    it('si se revocó al tutor, vuelve a faltar su autorización', () => {
      expect(
        estadoUsoImagen(
          {
            fechaNacimiento: MENOR,
            consentimientoImagen: AUTORIZACION_IMAGEN,
            autorizacionTutor: TUTOR_REVOCADO,
          },
          HOY,
        ),
      ).toBe('REQUIERE_TUTOR')
    })
  })

  it('al cumplir 18, el tutor ya no cuenta y la autorización que dio no vale', () => {
    expect(
      estadoUsoImagen(
        {
          fechaNacimiento: '2008-11-10',
          consentimientoImagen: autorizadaEl('2026-11-09T15:00:00.000Z'),
          autorizacionTutor: TUTOR_ACTIVO,
        },
        HOY,
      ),
    ).toBe('NO_AUTORIZADA')
  })

  it('el día que cumple 18 ya no necesita al tutor', () => {
    expect(
      estadoUsoImagen(
        { fechaNacimiento: '2008-11-19', consentimientoImagen: null, autorizacionTutor: null },
        HOY,
      ),
    ).toBe('NO_AUTORIZADA')
  })

  describe('al cumplir 18 años', () => {
    const CUMPLIO_18_EL_10 = '2008-11-10'

    it('no vale la autorización que se dio cuando era menor', () => {
      const autorizacion = autorizadaEl('2026-11-09T15:00:00.000Z')

      expect(
        estadoUsoImagen(
          {
            fechaNacimiento: CUMPLIO_18_EL_10,
            consentimientoImagen: autorizacion,
            autorizacionTutor: null,
          },
          HOY,
        ),
      ).toBe('NO_AUTORIZADA')
    })

    it('vale la que dio el mismo día que cumplió 18', () => {
      const autorizacion = autorizadaEl('2026-11-10T15:00:00.000Z')

      expect(
        estadoUsoImagen(
          {
            fechaNacimiento: CUMPLIO_18_EL_10,
            consentimientoImagen: autorizacion,
            autorizacionTutor: null,
          },
          HOY,
        ),
      ).toBe('AUTORIZADA')
    })

    it('cuenta el día en Colombia, no en UTC', () => {
      // 9 de noviembre a las 22:00 en Colombia, cuando en UTC ya era el 10.
      const autorizacion = autorizadaEl('2026-11-10T03:00:00.000Z')

      expect(
        estadoUsoImagen(
          {
            fechaNacimiento: CUMPLIO_18_EL_10,
            consentimientoImagen: autorizacion,
            autorizacionTutor: null,
          },
          HOY,
        ),
      ).toBe('NO_AUTORIZADA')
    })
  })

  it('no da por buena una autorización con una fecha que no se puede leer', () => {
    expect(
      estadoUsoImagen(
        {
          fechaNacimiento: ADULTO,
          consentimientoImagen: autorizadaEl('no es una fecha'),
          autorizacionTutor: null,
        },
        HOY,
      ),
    ).toBe('NO_AUTORIZADA')
  })
})

describe('vencioAlCumplir18', () => {
  const CUMPLIO_18_EL_10 = '2008-11-10'
  const datos = (registradoEn: string | null, fechaNacimiento = CUMPLIO_18_EL_10) => ({
    fechaNacimiento,
    consentimientoImagen: registradoEn === null ? null : autorizadaEl(registradoEn),
    autorizacionTutor: null,
  })

  it('vence la que se dio siendo menor, una vez cumple 18', () => {
    expect(vencioAlCumplir18(datos('2026-11-09T15:00:00.000Z'), HOY)).toBe(true)
  })

  it('no vence la que dio ya siendo mayor', () => {
    expect(vencioAlCumplir18(datos('2026-11-10T15:00:00.000Z'), HOY)).toBe(false)
  })

  it('mientras siga siendo menor, no ha vencido', () => {
    expect(vencioAlCumplir18(datos('2026-11-01T15:00:00.000Z', MENOR), HOY)).toBe(false)
  })

  it('sin autorización no hay nada que venza', () => {
    expect(vencioAlCumplir18(datos(null), HOY)).toBe(false)
  })
})
