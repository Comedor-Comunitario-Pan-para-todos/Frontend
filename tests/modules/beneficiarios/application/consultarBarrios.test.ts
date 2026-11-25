import { describe, expect, it, vi } from 'vitest'
import { crearConsultarBarrios } from '@/modules/beneficiarios/application/consultarBarrios.ts'
import { crearRepositorioDePrueba } from '../datosDePrueba.ts'

describe('consultarBarrios', () => {
  it('devuelve los barrios del padrón', async () => {
    const repositorio = crearRepositorioDePrueba()
    vi.mocked(repositorio.listarBarrios).mockResolvedValue(['Cuba', 'El Jardín'])

    await expect(crearConsultarBarrios({ repositorio })()).resolves.toEqual(['Cuba', 'El Jardín'])
  })
})
