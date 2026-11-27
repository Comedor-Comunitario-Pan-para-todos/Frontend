import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { HojaInferior } from '@/shared/ui/HojaInferior.tsx'

function hoja(abierta: boolean, alCerrar = vi.fn()) {
  return (
    <HojaInferior abierta={abierta} titulo="Pedir autorización" alCerrar={alCerrar}>
      <p>Contenido</p>
    </HojaInferior>
  )
}

describe('HojaInferior', () => {
  it('abierta, se nombra con su título y muestra el contenido', () => {
    render(hoja(true))

    const dialogo = screen.getByRole('dialog', { name: 'Pedir autorización' })

    expect(dialogo).toHaveAttribute('open')
    expect(screen.getByText('Contenido')).toBeInTheDocument()
  })

  it('cerrada, no monta el contenido', () => {
    const { rerender } = render(hoja(true))

    rerender(hoja(false))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.queryByText('Contenido')).not.toBeInTheDocument()
  })

  it('la X avisa que se quiere cerrar', async () => {
    const alCerrar = vi.fn()
    render(hoja(true, alCerrar))

    await userEvent.click(screen.getByRole('button', { name: 'Cerrar' }))

    expect(alCerrar).toHaveBeenCalledOnce()
  })

  it('Escape avisa que se quiere cerrar y deja que decida quien la abrió', () => {
    const alCerrar = vi.fn()
    render(hoja(true, alCerrar))
    const dialogo = screen.getByRole('dialog')

    const siguioSuCurso = fireEvent(dialogo, new Event('cancel', { cancelable: true }))

    expect(alCerrar).toHaveBeenCalledOnce()
    expect(siguioSuCurso).toBe(false)
    expect(dialogo).toHaveAttribute('open')
  })
})
