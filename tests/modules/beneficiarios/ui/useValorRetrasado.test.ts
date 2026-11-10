import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useValorRetrasado } from '@/modules/beneficiarios/ui/useValorRetrasado.ts'

function renderizar(valorInicial: string) {
  return renderHook(({ valor }) => useValorRetrasado(valor, 300), {
    initialProps: { valor: valorInicial },
  })
}

describe('useValorRetrasado', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('entrega el valor inicial sin esperar', () => {
    const { result } = renderizar('mar')

    expect(result.current).toBe('mar')
  })

  it('entrega el valor nuevo cuando pasa el tiempo sin más cambios', () => {
    const { result, rerender } = renderizar('mar')

    rerender({ valor: 'maría' })
    act(() => vi.advanceTimersByTime(299))
    expect(result.current).toBe('mar')

    act(() => vi.advanceTimersByTime(1))
    expect(result.current).toBe('maría')
  })

  it('mientras se sigue escribiendo vuelve a esperar', () => {
    const { result, rerender } = renderizar('m')

    rerender({ valor: 'ma' })
    act(() => vi.advanceTimersByTime(200))
    rerender({ valor: 'mar' })
    act(() => vi.advanceTimersByTime(200))
    expect(result.current).toBe('m')

    act(() => vi.advanceTimersByTime(100))
    expect(result.current).toBe('mar')
  })
})
