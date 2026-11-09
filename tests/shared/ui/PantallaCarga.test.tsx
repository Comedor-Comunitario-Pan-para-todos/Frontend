import { act, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { PantallaCarga } from '@/shared/ui/PantallaCarga.tsx'

describe('PantallaCarga', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('no muestra nada si la carga es breve', () => {
    render(<PantallaCarga />)

    act(() => {
      vi.advanceTimersByTime(199)
    })

    expect(screen.getByRole('status')).toBeEmptyDOMElement()
  })

  it('muestra el mensaje si la carga se demora', () => {
    render(<PantallaCarga />)

    act(() => {
      vi.advanceTimersByTime(200)
    })

    expect(screen.getByRole('status')).toHaveTextContent('Cargando')
  })

  it('permite indicar otro mensaje', () => {
    render(<PantallaCarga mensaje="Validando su sesión" />)

    act(() => {
      vi.advanceTimersByTime(200)
    })

    expect(screen.getByText('Validando su sesión')).toBeInTheDocument()
  })
})
