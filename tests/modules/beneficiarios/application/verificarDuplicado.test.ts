import { describe, expect, it, vi } from 'vitest'
import { crearVerificarDuplicado } from '@/modules/beneficiarios/application/verificarDuplicado.ts'
import { ErrorApi } from '@/shared/application/errores/ErrorApi.ts'
import { CARLOS, crearRepositorioDePrueba, MARIA, paginaCon } from '../datosDePrueba.ts'

const IDENTIDAD_DE_CARLOS = {
  nombres: 'Carlos Julio',
  apellidos: 'Morales Restrepo',
  fechaNacimiento: '2014-03-15',
}

describe('verificarDuplicado', () => {
  describe('por documento', () => {
    it('avisa si alguien ya tiene ese documento', async () => {
      const repositorio = crearRepositorioDePrueba()
      vi.mocked(repositorio.buscarPorDocumento).mockResolvedValue(MARIA)

      const resultado = await crearVerificarDuplicado({ repositorio })({
        numeroDocumento: '42.185.390',
      })

      expect(resultado).toEqual({ motivo: 'documento', beneficiario: MARIA })
      expect(repositorio.buscarPorDocumento).toHaveBeenCalledWith('42185390', undefined)
    })

    it('si nadie lo tiene y faltan los demás datos, no hay aviso', async () => {
      const repositorio = crearRepositorioDePrueba()

      const resultado = await crearVerificarDuplicado({ repositorio })({
        numeroDocumento: '1088234567',
        nombres: 'Rosa',
      })

      expect(resultado).toBeNull()
      expect(repositorio.buscar).not.toHaveBeenCalled()
    })

    it.each(['', '   ', '...'])('sin número ("%s") no consulta por documento', async (numero) => {
      const repositorio = crearRepositorioDePrueba()

      await crearVerificarDuplicado({ repositorio })({ numeroDocumento: numero })

      expect(repositorio.buscarPorDocumento).not.toHaveBeenCalled()
    })
  })

  describe('por nombre y fecha de nacimiento', () => {
    it('avisa si coincide con alguien del padrón', async () => {
      const repositorio = crearRepositorioDePrueba()
      vi.mocked(repositorio.buscar).mockResolvedValue(paginaCon(MARIA, CARLOS))

      const resultado = await crearVerificarDuplicado({ repositorio })(IDENTIDAD_DE_CARLOS)

      expect(resultado).toEqual({ motivo: 'nombre-y-fecha', beneficiario: CARLOS })
    })

    it('pide al padrón por el primer apellido, hasta el máximo de una página', async () => {
      const repositorio = crearRepositorioDePrueba()

      await crearVerificarDuplicado({ repositorio })(IDENTIDAD_DE_CARLOS)

      expect(repositorio.buscar).toHaveBeenCalledWith(
        { texto: 'Morales', pagina: 1, porPagina: 100 },
        undefined,
      )
    })

    it('ignora tildes, mayúsculas y espacios al comparar', async () => {
      const repositorio = crearRepositorioDePrueba()
      vi.mocked(repositorio.buscar).mockResolvedValue(paginaCon(MARIA))

      const resultado = await crearVerificarDuplicado({ repositorio })({
        nombres: ' maria ELENA ',
        apellidos: ' restrepo',
        fechaNacimiento: MARIA.fechaNacimiento,
      })

      expect(resultado?.beneficiario).toBe(MARIA)
    })

    it('no avisa si el nombre coincide pero la fecha es otra', async () => {
      const repositorio = crearRepositorioDePrueba()
      vi.mocked(repositorio.buscar).mockResolvedValue(paginaCon(CARLOS))

      const resultado = await crearVerificarDuplicado({ repositorio })({
        ...IDENTIDAD_DE_CARLOS,
        fechaNacimiento: '2014-03-16',
      })

      expect(resultado).toBeNull()
    })

    it.each([
      ['los nombres', { nombres: ' ' }],
      ['los apellidos', { apellidos: '' }],
      ['la fecha de nacimiento', { fechaNacimiento: '' }],
    ])('si faltan %s no consulta el padrón', async (_dato, faltante) => {
      const repositorio = crearRepositorioDePrueba()

      const resultado = await crearVerificarDuplicado({ repositorio })({
        ...IDENTIDAD_DE_CARLOS,
        ...faltante,
      })

      expect(resultado).toBeNull()
      expect(repositorio.buscar).not.toHaveBeenCalled()
    })
  })

  it('el documento tiene prioridad sobre el nombre', async () => {
    const repositorio = crearRepositorioDePrueba()
    vi.mocked(repositorio.buscarPorDocumento).mockResolvedValue(MARIA)
    vi.mocked(repositorio.buscar).mockResolvedValue(paginaCon(CARLOS))

    const resultado = await crearVerificarDuplicado({ repositorio })({
      ...IDENTIDAD_DE_CARLOS,
      numeroDocumento: '42185390',
    })

    expect(resultado).toEqual({ motivo: 'documento', beneficiario: MARIA })
    expect(repositorio.buscar).not.toHaveBeenCalled()
  })

  it('con documento libre revisa también el nombre y la fecha', async () => {
    const repositorio = crearRepositorioDePrueba()
    vi.mocked(repositorio.buscar).mockResolvedValue(paginaCon(CARLOS))

    const resultado = await crearVerificarDuplicado({ repositorio })({
      ...IDENTIDAD_DE_CARLOS,
      numeroDocumento: '1088234567',
    })

    expect(resultado).toEqual({ motivo: 'nombre-y-fecha', beneficiario: CARLOS })
  })

  it('entrega la señal de cancelación a las dos consultas', async () => {
    const repositorio = crearRepositorioDePrueba()
    const { signal } = new AbortController()

    await crearVerificarDuplicado({ repositorio })(
      { ...IDENTIDAD_DE_CARLOS, numeroDocumento: '1088234567' },
      signal,
    )

    expect(repositorio.buscarPorDocumento).toHaveBeenCalledWith('1088234567', signal)
    expect(repositorio.buscar).toHaveBeenCalledWith(expect.anything(), signal)
  })

  it('si el servidor falla deja pasar el error', async () => {
    const repositorio = crearRepositorioDePrueba()
    const caida = new ErrorApi({ tipo: 'red' })
    vi.mocked(repositorio.buscarPorDocumento).mockRejectedValue(caida)

    await expect(
      crearVerificarDuplicado({ repositorio })({ numeroDocumento: '42185390' }),
    ).rejects.toBe(caida)
  })
})
