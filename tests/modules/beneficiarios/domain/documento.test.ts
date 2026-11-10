import { describe, expect, it } from 'vitest'
import {
  enmascararDocumento,
  etiquetaTipoDocumento,
  formatearNumeroDocumento,
  normalizarNumeroDocumento,
  TIPOS_DOCUMENTO,
  ultimosDigitos,
} from '@/modules/beneficiarios/domain/documento.ts'

describe('etiquetaTipoDocumento', () => {
  it.each([
    ['CC', 'Cédula de ciudadanía'],
    ['TI', 'Tarjeta de identidad'],
    ['RC', 'Registro civil'],
    ['PPT', 'Permiso por Protección Temporal'],
  ])('%s se muestra como "%s"', (tipo, etiqueta) => {
    expect(etiquetaTipoDocumento(tipo)).toBe(etiqueta)
  })

  it('todos los tipos que se pueden elegir tienen etiqueta propia', () => {
    for (const tipo of TIPOS_DOCUMENTO) {
      expect(etiquetaTipoDocumento(tipo)).not.toBe(tipo)
    }
  })

  it('un tipo que no conoce se muestra con su sigla', () => {
    expect(etiquetaTipoDocumento('CE')).toBe('CE')
  })
})

describe('normalizarNumeroDocumento', () => {
  it.each([
    ['42.185.390', '42185390'],
    [' 42185390 ', '42185390'],
    ['42 185 390', '42185390'],
    ['42,185,390', '42185390'],
    ['1088-234-567', '1088234567'],
    ['ab123', 'AB123'],
    ['', ''],
  ])('"%s" queda como "%s"', (escrito, esperado) => {
    expect(normalizarNumeroDocumento(escrito)).toBe(esperado)
  })
})

describe('formatearNumeroDocumento', () => {
  it.each([
    ['42185390', '42.185.390'],
    ['1088234567', '1.088.234.567'],
    ['5012345', '5.012.345'],
    ['123', '123'],
    ['1234', '1.234'],
    ['AB123456', 'AB123456'],
    ['', ''],
  ])('"%s" se muestra como "%s"', (numero, esperado) => {
    expect(formatearNumeroDocumento(numero)).toBe(esperado)
  })
})

describe('ultimosDigitos', () => {
  it.each([
    ['1088234567', '4567'],
    ['12345', '2345'],
    ['1234', ''],
    ['', ''],
  ])('de "%s" deja ver "%s"', (numero, esperado) => {
    expect(ultimosDigitos(numero)).toBe(esperado)
  })
})

describe('enmascararDocumento', () => {
  it('deja ver solo los últimos cuatro dígitos', () => {
    expect(enmascararDocumento('1088234567')).toBe('••••4567')
  })

  it('no revela cuántos dígitos tiene el documento', () => {
    expect(enmascararDocumento('42185390')).toHaveLength(enmascararDocumento('1088234567').length)
  })

  it.each(['', '7', '1234'])('oculta completo un número de cuatro dígitos o menos ("%s")', (n) => {
    expect(enmascararDocumento(n)).toBe('••••')
  })
})
