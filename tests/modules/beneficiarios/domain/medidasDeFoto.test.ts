import { describe, expect, it } from 'vitest'
import { medidasReducidas } from '@/modules/beneficiarios/domain/medidasDeFoto.ts'

describe('medidasReducidas', () => {
  it('una foto vertical de teléfono queda con 1600 px de alto, sin deformarse', () => {
    expect(medidasReducidas({ ancho: 3000, alto: 4000 })).toEqual({ ancho: 1200, alto: 1600 })
  })

  it('una foto horizontal queda con 1600 px de ancho', () => {
    expect(medidasReducidas({ ancho: 4032, alto: 3024 })).toEqual({ ancho: 1600, alto: 1200 })
  })

  it('no agranda una foto pequeña y la devuelve tal cual', () => {
    const medidas = { ancho: 1200, alto: 1600 }

    expect(medidasReducidas(medidas)).toBe(medidas)
  })

  it('redondea los píxeles y nunca deja un lado en cero', () => {
    expect(medidasReducidas({ ancho: 1, alto: 5000 }, 1600)).toEqual({ ancho: 1, alto: 1600 })
    expect(medidasReducidas({ ancho: 1000, alto: 3001 }, 1600)).toEqual({ ancho: 533, alto: 1600 })
    expect(medidasReducidas({ ancho: 3000, alto: 1003 }, 1600)).toEqual({ ancho: 1600, alto: 535 })
  })
})
