import { describe, expect, it, vi } from 'vitest'
import {
  BENEFICIARIOS_POR_PAGINA,
  crearBuscarBeneficiarios,
} from '@/modules/beneficiarios/application/buscarBeneficiarios.ts'
import { crearRepositorioDePrueba, MARIA, paginaCon } from '../datosDePrueba.ts'

function criterios(texto: string, pagina = 1) {
  return { texto, pagina, porPagina: BENEFICIARIOS_POR_PAGINA }
}

describe('buscarBeneficiarios', () => {
  it('devuelve la página que entrega el padrón', async () => {
    const repositorio = crearRepositorioDePrueba()
    vi.mocked(repositorio.buscar).mockResolvedValue(paginaCon(MARIA))

    const pagina = await crearBuscarBeneficiarios({ repositorio })({ texto: 'María' })

    expect(pagina).toEqual(paginaCon(MARIA))
  })

  it('sin texto trae la primera página de todo el padrón', async () => {
    const repositorio = crearRepositorioDePrueba()

    await crearBuscarBeneficiarios({ repositorio })()

    expect(repositorio.buscar).toHaveBeenCalledWith(criterios(''), undefined)
  })

  it('pide la página indicada', async () => {
    const repositorio = crearRepositorioDePrueba()

    await crearBuscarBeneficiarios({ repositorio })({ texto: 'Restrepo', pagina: 3 })

    expect(repositorio.buscar).toHaveBeenCalledWith(criterios('Restrepo', 3), undefined)
  })

  it.each([
    ['  María   Elena ', 'María Elena'],
    ['42.185.390', '42185390'],
    [' 42 185 390 ', '42185390'],
    ['1088-234-567', '1088234567'],
    ['Calle 42.5', 'Calle 42.5'],
    ['...', '...'],
  ])('busca "%s" como "%s"', async (escrito, enviado) => {
    const repositorio = crearRepositorioDePrueba()

    await crearBuscarBeneficiarios({ repositorio })({ texto: escrito })

    expect(repositorio.buscar).toHaveBeenCalledWith(criterios(enviado), undefined)
  })

  it('entrega la señal de cancelación al repositorio', async () => {
    const repositorio = crearRepositorioDePrueba()
    const { signal } = new AbortController()

    await crearBuscarBeneficiarios({ repositorio })({ texto: 'María' }, signal)

    expect(repositorio.buscar).toHaveBeenCalledWith(criterios('María'), signal)
  })
})
