import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DescargaNavegador } from '@/modules/reportes/infrastructure/dispositivo/DescargaNavegador.ts'

describe('DescargaNavegador', () => {
  const crearUrl = vi.fn(() => 'blob:padron')
  const liberarUrl = vi.fn()

  beforeEach(() => {
    vi.useFakeTimers()
    URL.createObjectURL = crearUrl
    URL.revokeObjectURL = liberarUrl
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
    crearUrl.mockClear()
    liberarUrl.mockClear()
  })

  it('descarga el archivo con su nombre y no deja el enlace en la página', () => {
    const clics: { href: string; download: string }[] = []
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
      this: HTMLAnchorElement,
    ) {
      clics.push({ href: this.href, download: this.download })
    })
    const contenido = new Blob(['PK'])

    new DescargaNavegador().guardar({ nombre: 'padron.xlsx', contenido })

    expect(crearUrl).toHaveBeenCalledWith(contenido)
    expect(clics).toEqual([{ href: 'blob:padron', download: 'padron.xlsx' }])
    expect(document.querySelector('a[download]')).toBeNull()
  })

  it('libera la URL temporal unos segundos después', () => {
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})

    new DescargaNavegador().guardar({ nombre: 'padron.xlsx', contenido: new Blob(['PK']) })

    expect(liberarUrl).not.toHaveBeenCalled()
    vi.advanceTimersByTime(10_000)
    expect(liberarUrl).toHaveBeenCalledWith('blob:padron')
  })
})
