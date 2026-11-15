import { describe, expect, it } from 'vitest'
import {
  descripcionGrupo,
  esGrupoClasificacion,
  esSistemaClasificacion,
  etiquetaSistemaClasificacion,
  GRUPOS_CLASIFICACION,
} from '@/modules/beneficiarios/domain/clasificacionSocioeconomica.ts'

describe('GRUPOS_CLASIFICACION', () => {
  it('tiene los 51 subgrupos, de A1 a D21', () => {
    expect(GRUPOS_CLASIFICACION).toHaveLength(51)
    expect(GRUPOS_CLASIFICACION[0]).toBe('A1')
    expect(GRUPOS_CLASIFICACION.at(-1)).toBe('D21')
  })

  it.each(['A5', 'B7', 'C18', 'D21'])('incluye el último subgrupo de cada grupo (%s)', (grupo) => {
    expect(esGrupoClasificacion(grupo)).toBe(true)
  })

  it.each(['A6', 'B8', 'C19', 'D22', 'E1', 'a1', ''])('rechaza "%s"', (grupo) => {
    expect(esGrupoClasificacion(grupo)).toBe(false)
  })
})

describe('esSistemaClasificacion', () => {
  it.each(['RUI', 'SISBEN_IV'])('acepta %s', (sistema) => {
    expect(esSistemaClasificacion(sistema)).toBe(true)
  })

  it('rechaza el Sisbén III, que ya no está vigente', () => {
    expect(esSistemaClasificacion('SISBEN_III')).toBe(false)
  })
})

describe('etiquetaSistemaClasificacion', () => {
  it.each([
    ['RUI', 'Registro Universal de Ingresos (RUI)'],
    ['SISBEN_IV', 'Sisbén IV'],
  ])('%s se muestra como "%s"', (sistema, etiqueta) => {
    expect(etiquetaSistemaClasificacion(sistema)).toBe(etiqueta)
  })

  it('un sistema que no conoce se muestra tal cual', () => {
    expect(etiquetaSistemaClasificacion('OTRO')).toBe('OTRO')
  })
})

describe('descripcionGrupo', () => {
  it.each([
    ['A1', 'Pobreza extrema'],
    ['B7', 'Pobreza moderada'],
    ['C12', 'Vulnerable'],
    ['D21', 'No pobre ni vulnerable'],
  ])('%s es "%s"', (grupo, descripcion) => {
    expect(descripcionGrupo(grupo)).toBe(descripcion)
  })

  it('un subgrupo inválido no tiene descripción', () => {
    expect(descripcionGrupo('A9')).toBe('')
  })
})
