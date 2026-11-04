import { describe, expect, it } from 'vitest'
import { puedeTomarFoto } from '@/modules/beneficiarios/domain/permisoFoto.ts'

const HOY = '2026-11-04'
const NACIMIENTO_ADULTO = '1990-07-20'
const NACIMIENTO_MENOR = '2014-03-15'

describe('puedeTomarFoto', () => {
  it('permite la foto de un adulto que aceptó el uso de imagen', () => {
    const adulto = { aceptaUsoImagen: true, fechaNacimiento: NACIMIENTO_ADULTO, tieneAutorizacionTutor: false }
    expect(puedeTomarFoto(adulto, HOY)).toBe(true)
  })

  it('bloquea la foto si no aceptó el uso de imagen', () => {
    const adulto = { aceptaUsoImagen: false, fechaNacimiento: NACIMIENTO_ADULTO, tieneAutorizacionTutor: false }
    expect(puedeTomarFoto(adulto, HOY)).toBe(false)
  })

  it('bloquea la foto de un menor sin autorización del tutor', () => {
    const menor = { aceptaUsoImagen: true, fechaNacimiento: NACIMIENTO_MENOR, tieneAutorizacionTutor: false }
    expect(puedeTomarFoto(menor, HOY)).toBe(false)
  })

  it('permite la foto de un menor con autorización del tutor', () => {
    const menor = { aceptaUsoImagen: true, fechaNacimiento: NACIMIENTO_MENOR, tieneAutorizacionTutor: true }
    expect(puedeTomarFoto(menor, HOY)).toBe(true)
  })

  it('bloquea la foto si no hay fecha de nacimiento', () => {
    const sinFecha = { aceptaUsoImagen: true, fechaNacimiento: null, tieneAutorizacionTutor: true }
    expect(puedeTomarFoto(sinFecha, HOY)).toBe(false)
  })
})
