import { describe, expect, it, vi } from 'vitest'
import type { FotoPort } from '@/modules/beneficiarios/application/ports/FotoPort.ts'
import { crearPrepararSoporte } from '@/modules/beneficiarios/application/prepararSoporte.ts'
import type { Medidas } from '@/modules/beneficiarios/domain/medidasDeFoto.ts'

const REDIBUJADA = new File(['jpeg'], 'firma.jpg', { type: 'image/jpeg' })

function crearFoto(medidas: Medidas = { ancho: 3000, alto: 4000 }): FotoPort {
  return {
    medir: vi.fn().mockResolvedValue(medidas),
    redibujarEnJpeg: vi.fn().mockResolvedValue(REDIBUJADA),
  }
}

function archivo(tipo: string, tamano = 1024, nombre = 'firma') {
  return new File([new Uint8Array(tamano)], nombre, { type: tipo })
}

describe('prepararSoporte', () => {
  it('achica una foto grande del teléfono a 1600 px por el lado largo', async () => {
    const foto = crearFoto({ ancho: 3000, alto: 4000 })
    const original = archivo('image/jpeg')

    const preparado = await crearPrepararSoporte({ foto })(original)

    expect(preparado).toBe(REDIBUJADA)
    expect(foto.redibujarEnJpeg).toHaveBeenCalledWith(original, { ancho: 1200, alto: 1600 })
  })

  it('deja igual una foto pequeña en JPG o PNG', async () => {
    const foto = crearFoto({ ancho: 1200, alto: 1600 })
    const original = archivo('image/png')

    await expect(crearPrepararSoporte({ foto })(original)).resolves.toBe(original)
    expect(foto.redibujarEnJpeg).not.toHaveBeenCalled()
  })

  it('pasa a JPEG una foto pequeña en otro formato, sin cambiar su tamaño', async () => {
    const foto = crearFoto({ ancho: 1200, alto: 1600 })
    const original = archivo('image/heic')

    await expect(crearPrepararSoporte({ foto })(original)).resolves.toBe(REDIBUJADA)
    expect(foto.redibujarEnJpeg).toHaveBeenCalledWith(original, { ancho: 1200, alto: 1600 })
  })

  it('vuelve a comprimir una foto pequeña que pesa más de 5 MB', async () => {
    const foto = crearFoto({ ancho: 1200, alto: 1600 })

    await expect(
      crearPrepararSoporte({ foto })(archivo('image/png', 5 * 1024 * 1024 + 1)),
    ).resolves.toBe(REDIBUJADA)
  })

  it('no toca un PDF', async () => {
    const foto = crearFoto()
    const pdf = archivo('application/pdf')

    await expect(crearPrepararSoporte({ foto })(pdf)).resolves.toBe(pdf)
    expect(foto.medir).not.toHaveBeenCalled()
  })

  it('no intenta redibujar un archivo que no es una foto', async () => {
    const foto = crearFoto()
    const texto = archivo('text/plain')

    await expect(crearPrepararSoporte({ foto })(texto)).resolves.toBe(texto)
    expect(foto.medir).not.toHaveBeenCalled()
  })

  it('si el teléfono no puede leer la foto, la deja igual para que la validación decida', async () => {
    const foto = crearFoto()
    vi.mocked(foto.medir).mockRejectedValue(new Error('formato no soportado'))
    const original = archivo('image/heic')

    await expect(crearPrepararSoporte({ foto })(original)).resolves.toBe(original)
  })
})
