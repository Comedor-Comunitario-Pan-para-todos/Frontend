import { describe, expect, it, vi } from 'vitest'
import { crearConsultarBeneficiario } from '@/modules/beneficiarios/application/consultarBeneficiario.ts'
import { ErrorApi } from '@/shared/application/errores/ErrorApi.ts'
import { crearRepositorioDePrueba, MARIA } from '../datosDePrueba.ts'

describe('consultarBeneficiario', () => {
  it('devuelve la ficha de la persona', async () => {
    const repositorio = crearRepositorioDePrueba()
    const { signal } = new AbortController()

    const ficha = await crearConsultarBeneficiario({ repositorio })(MARIA.id, signal)

    expect(ficha).toEqual(MARIA)
    expect(repositorio.consultarPorId).toHaveBeenCalledWith(MARIA.id, signal)
  })

  it('si la persona no existe deja pasar el error', async () => {
    const repositorio = crearRepositorioDePrueba()
    const noEncontrado = new ErrorApi({ tipo: 'no-encontrado', estado: 404 })
    vi.mocked(repositorio.consultarPorId).mockRejectedValue(noEncontrado)

    await expect(crearConsultarBeneficiario({ repositorio })(MARIA.id)).rejects.toBe(noEncontrado)
  })
})
