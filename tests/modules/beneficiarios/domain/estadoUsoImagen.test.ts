import { describe, expect, it } from 'vitest'
import { estadoUsoImagen } from '@/modules/beneficiarios/domain/estadoUsoImagen.ts'
import { AUTORIZACION_IMAGEN } from '../consentimientosDePrueba.ts'

const HOY = '2026-11-19'
const ADULTO = '1958-03-15'
const MENOR = '2014-03-15'

describe('estadoUsoImagen', () => {
  it('sin autorización, a un adulto no se le pueden tomar fotos', () => {
    expect(estadoUsoImagen({ fechaNacimiento: ADULTO, consentimientoImagen: null }, HOY)).toBe(
      'NO_AUTORIZADA',
    )
  })

  it('con autorización vigente, se le pueden tomar fotos', () => {
    expect(
      estadoUsoImagen({ fechaNacimiento: ADULTO, consentimientoImagen: AUTORIZACION_IMAGEN }, HOY),
    ).toBe('AUTORIZADA')
  })

  it('a un menor sin autorización le falta la de su tutor', () => {
    expect(estadoUsoImagen({ fechaNacimiento: MENOR, consentimientoImagen: null }, HOY)).toBe(
      'REQUIERE_TUTOR',
    )
  })

  it('a un menor con autorización vigente se le pueden tomar fotos', () => {
    expect(
      estadoUsoImagen({ fechaNacimiento: MENOR, consentimientoImagen: AUTORIZACION_IMAGEN }, HOY),
    ).toBe('AUTORIZADA')
  })

  it('el día que cumple 18 ya no necesita al tutor', () => {
    expect(
      estadoUsoImagen({ fechaNacimiento: '2008-11-19', consentimientoImagen: null }, HOY),
    ).toBe('NO_AUTORIZADA')
  })
})
