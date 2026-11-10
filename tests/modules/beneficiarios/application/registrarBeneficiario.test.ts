import { describe, expect, it, vi } from 'vitest'
import { crearRegistrarBeneficiario } from '@/modules/beneficiarios/application/registrarBeneficiario.ts'
import { BeneficiarioDuplicado } from '@/modules/beneficiarios/domain/BeneficiarioDuplicado.ts'
import type { NuevoBeneficiario } from '@/modules/beneficiarios/domain/Beneficiario.ts'
import { crearRepositorioDePrueba, MARIA } from '../datosDePrueba.ts'

const DATOS: NuevoBeneficiario = {
  nombres: 'María Elena',
  apellidos: 'Restrepo',
  documento: { tipo: 'CC', numero: '42185390' },
  fechaNacimiento: '1958-03-15',
  barrio: 'El Poblado',
}

describe('registrarBeneficiario', () => {
  it('registra a la persona y devuelve su ficha', async () => {
    const repositorio = crearRepositorioDePrueba()

    const ficha = await crearRegistrarBeneficiario({ repositorio })(DATOS)

    expect(ficha).toEqual(MARIA)
    expect(repositorio.registrar).toHaveBeenCalledWith(DATOS)
  })

  it('envía los datos limpios, como deben quedar guardados', async () => {
    const repositorio = crearRepositorioDePrueba()

    await crearRegistrarBeneficiario({ repositorio })({
      ...DATOS,
      nombres: '  María   Elena ',
      documento: { tipo: 'CC', numero: '42.185.390' },
      barrio: '   ',
    })

    expect(repositorio.registrar).toHaveBeenCalledWith({ ...DATOS, barrio: null })
  })

  it('una persona sin documento se registra sin documento', async () => {
    const repositorio = crearRepositorioDePrueba()

    await crearRegistrarBeneficiario({ repositorio })({ ...DATOS, documento: null })

    expect(repositorio.registrar).toHaveBeenCalledWith({ ...DATOS, documento: null })
  })

  it('no consulta el padrón antes de registrar', async () => {
    const repositorio = crearRepositorioDePrueba()

    await crearRegistrarBeneficiario({ repositorio })(DATOS)

    expect(repositorio.buscar).not.toHaveBeenCalled()
    expect(repositorio.buscarPorDocumento).not.toHaveBeenCalled()
  })

  it('si la persona ya existe deja pasar el error de duplicado', async () => {
    const repositorio = crearRepositorioDePrueba()
    const duplicado = new BeneficiarioDuplicado('42185390')
    vi.mocked(repositorio.registrar).mockRejectedValue(duplicado)

    await expect(crearRegistrarBeneficiario({ repositorio })(DATOS)).rejects.toBe(duplicado)
  })
})
