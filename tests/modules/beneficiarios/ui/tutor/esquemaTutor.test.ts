import { describe, expect, it } from 'vitest'
import {
  aNuevaAutorizacionTutor,
  CAMPOS_TUTOR_INICIALES,
  esquemaTutor,
  type CamposTutor,
} from '@/modules/beneficiarios/ui/tutor/esquemaTutor.ts'

const SOPORTE = new File(['firma'], 'papel.jpg', { type: 'image/jpeg' })

const VALIDOS: CamposTutor = {
  nombre: 'Luz Marina Díaz',
  parentesco: 'MADRE',
  tipoDocumento: 'CC',
  numeroDocumento: '52.123.456',
  telefono: '310 123 4567',
  soporte: SOPORTE,
  revisado: true,
}

function errores(campos: Partial<CamposTutor>) {
  const resultado = esquemaTutor.safeParse({ ...VALIDOS, ...campos })
  if (resultado.success) return {}
  return Object.fromEntries(resultado.error.issues.map((i) => [i.path[0], i.message]))
}

describe('esquemaTutor', () => {
  it('acepta los datos completos del tutor', () => {
    expect(esquemaTutor.safeParse(VALIDOS).success).toBe(true)
  })

  it('el formulario vacío pide cada dato', () => {
    expect(errores(CAMPOS_TUTOR_INICIALES)).toEqual({
      nombre: 'Escriba el nombre del tutor como aparece en el papel.',
      parentesco: 'Elija qué es del menor.',
      numeroDocumento: 'Escriba el número de documento del tutor.',
      telefono: 'Escriba el teléfono del tutor.',
      soporte: 'Tómele una foto al papel firmado o elija el archivo.',
      revisado: 'Marque la casilla después de revisar el papel firmado.',
    })
  })

  it('un nombre de solo espacios cuenta como vacío', () => {
    expect(errores({ nombre: '   ' }).nombre).toMatch(/Escriba el nombre/)
  })

  it('el nombre llega hasta 150 caracteres', () => {
    expect(errores({ nombre: 'a'.repeat(150) }).nombre).toBeUndefined()
    expect(errores({ nombre: 'a'.repeat(151) }).nombre).toBe(
      'El nombre no puede pasar de 150 caracteres.',
    )
  })

  it('rechaza un parentesco que no está en la lista', () => {
    expect(errores({ parentesco: 'ABUELA' }).parentesco).toBe('Elija qué es del menor.')
  })

  it('rechaza un tipo de documento que no es de adulto', () => {
    expect(errores({ tipoDocumento: 'TI' }).tipoDocumento).toBe('Elija el tipo de documento.')
  })

  it('revisa el número según el tipo, ya sin puntos ni espacios', () => {
    expect(errores({ numeroDocumento: '12' }).numeroDocumento).toBe(
      'Revise el número: cédula de ciudadanía lleva de 3 a 10 dígitos.',
    )
    expect(
      errores({ tipoDocumento: 'PASAPORTE', numeroDocumento: 'AB 123 456' }).numeroDocumento,
    ).toBeUndefined()
  })

  it('pide un teléfono de 7 o 10 dígitos', () => {
    expect(errores({ telefono: '31012' }).telefono).toBe(
      'Revise el teléfono: 7 dígitos si es fijo o 10 si es celular.',
    )
  })

  it('rechaza un soporte que no sirve, con el motivo', () => {
    const heic = new File(['firma'], 'papel.heic', { type: 'image/heic' })

    expect(errores({ soporte: heic }).soporte).toBe(
      'El soporte debe ser una foto (JPG o PNG) o un PDF.',
    )
  })

  it('entrega los datos para enviar, con el soporte elegido', () => {
    const datos = aNuevaAutorizacionTutor(esquemaTutor.parse(VALIDOS))

    expect(datos).toEqual({
      nombre: 'Luz Marina Díaz',
      parentesco: 'MADRE',
      tipoDocumento: 'CC',
      numeroDocumento: '52.123.456',
      telefono: '310 123 4567',
      soporte: SOPORTE,
    })
  })
})
