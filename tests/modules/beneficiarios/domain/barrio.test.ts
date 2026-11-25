import { describe, expect, it } from 'vitest'
import { claveDeBarrio, sugerirBarrios } from '@/modules/beneficiarios/domain/barrio.ts'

const BARRIOS = ['Cuba', 'El Jardín', 'El Poblado', 'Otún', 'Villasantana']

describe('claveDeBarrio', () => {
  it.each(['El Jardín', 'el jardin', '  EL   JARDÍN. ', 'El-Jardín'])(
    '"%s" se compara como "el jardin"',
    (texto) => {
      expect(claveDeBarrio(texto)).toBe('el jardin')
    },
  )

  it('conserva la ñ para no confundir Peña con Pena', () => {
    expect(claveDeBarrio('La Peña')).toBe('la peña')
  })

  it('separa lo que estaba unido por signos', () => {
    expect(claveDeBarrio('B/El Jardín')).toBe('b el jardin')
  })
})

describe('sugerirBarrios', () => {
  it('sin nada escrito no sugiere', () => {
    expect(sugerirBarrios('', BARRIOS)).toEqual([])
    expect(sugerirBarrios('  .  ', BARRIOS)).toEqual([])
  })

  it('sugiere los que empiezan por lo escrito, sin importar tildes ni mayúsculas', () => {
    expect(sugerirBarrios('el', BARRIOS)).toEqual(['El Jardín', 'El Poblado'])
    expect(sugerirBarrios('OTUN', BARRIOS)).toEqual(['Otún'])
  })

  it('no sugiere el barrio que ya está escrito igual', () => {
    expect(sugerirBarrios(' El Jardín ', BARRIOS)).toEqual([])
  })

  it('sí lo sugiere si cambia la forma, para dejarlo bien escrito', () => {
    expect(sugerirBarrios('el jardin', BARRIOS)).toEqual(['El Jardín'])
  })

  it('compara sin espacios: «Villa Santana» encuentra Villasantana', () => {
    expect(sugerirBarrios('Villa Santana', BARRIOS)).toEqual(['Villasantana'])
    expect(sugerirBarrios('Villa Santa', BARRIOS)).toEqual(['Villasantana'])
  })

  it('encuentra el barrio dentro de lo escrito, como «Barrio El Jardín»', () => {
    expect(sugerirBarrios('Barrio El Jardín', BARRIOS)).toEqual(['El Jardín'])
  })

  it.each([
    'Barrio villa santa',
    'B/ villasan',
    'Bº villa',
    'Br. Villa',
    'Sector villa',
    'Urb. Villa',
  ])('ignora el prefijo de «%s» al sugerir', (texto) => {
    expect(sugerirBarrios(texto, BARRIOS)).toEqual(['Villasantana'])
  })

  it('el prefijo se ignora solo si va antes de otra palabra', () => {
    expect(sugerirBarrios('barrio', ['Barrio Nuevo'])).toEqual(['Barrio Nuevo'])
    expect(sugerirBarrios('barrio', BARRIOS)).toEqual([])
    expect(sugerirBarrios('barrio nu', ['Barrio Nuevo'])).toEqual(['Barrio Nuevo'])
    expect(sugerirBarrios('Bosques', ['Bosques de la Acuarela'])).toEqual([
      'Bosques de la Acuarela',
    ])
  })

  it('encuentra el barrio dentro de lo escrito, como «El Jardín Alto»', () => {
    expect(sugerirBarrios('El Jardín Alto', BARRIOS)).toEqual(['El Jardín'])
  })

  it('con prefijo, se queda con la forma más parecida', () => {
    expect(sugerirBarrios('Barrio Cuba', ['Ciudad Cuba', 'Cuba'])).toEqual(['Cuba', 'Ciudad Cuba'])
  })

  it('encuentra lo escrito dentro del barrio desde 3 letras', () => {
    expect(sugerirBarrios('jar', BARRIOS)).toEqual(['El Jardín'])
    expect(sugerirBarrios('ja', BARRIOS)).toEqual([])
  })

  it('tolera una letra de más, de menos o cambiada', () => {
    expect(sugerirBarrios('Cuva', BARRIOS)).toEqual(['Cuba'])
    expect(sugerirBarrios('Villasntana', BARRIOS)).toEqual(['Villasantana'])
    expect(sugerirBarrios('Otuun', BARRIOS)).toEqual(['Otún'])
  })

  it('con menos de 4 letras no adivina errores', () => {
    expect(sugerirBarrios('Cba', ['Cuba'])).toEqual([])
  })

  it('con menos de 8 letras no tolera dos errores', () => {
    expect(sugerirBarrios('Kuva', BARRIOS)).toEqual([])
  })

  it('desde 8 letras tolera dos errores', () => {
    expect(sugerirBarrios('Vilasantna', BARRIOS)).toEqual(['Villasantana'])
    expect(sugerirBarrios('Vlasantna', BARRIOS)).toEqual([])
  })

  it('primero los que empiezan igual, luego los que contienen, luego los errores', () => {
    const barrios = ['Ciudad Jardín', 'Jardines', 'Jardín Bajo']
    expect(sugerirBarrios('jardin', barrios)).toEqual(['Jardines', 'Jardín Bajo', 'Ciudad Jardín'])
    expect(sugerirBarrios('jardin', ['Jardon', 'Ciudad Jardín'])).toEqual([
      'Ciudad Jardín',
      'Jardon',
    ])
  })

  it('sugiere como máximo 3', () => {
    expect(sugerirBarrios('el', ['El A', 'El B', 'El C', 'El D'])).toEqual(['El A', 'El B', 'El C'])
  })
})
