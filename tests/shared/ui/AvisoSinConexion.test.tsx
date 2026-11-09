import { act, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AvisoSinConexion } from '@/shared/ui/AvisoSinConexion.tsx'

function cambiarConexion(enLinea: boolean) {
  vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(enLinea)
  act(() => {
    window.dispatchEvent(new Event(enLinea ? 'online' : 'offline'))
  })
}

describe('AvisoSinConexion', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('no muestra nada con conexión', () => {
    render(<AvisoSinConexion />)

    expect(screen.getByRole('status')).toBeEmptyDOMElement()
  })

  it('aparece al perder la conexión y se va al recuperarla', () => {
    render(<AvisoSinConexion />)

    cambiarConexion(false)
    expect(screen.getByRole('status')).toHaveTextContent('Sin conexión')

    cambiarConexion(true)
    expect(screen.getByRole('status')).toBeEmptyDOMElement()
  })
})
