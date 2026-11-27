import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { useRecuperarFoco } from '@/shared/ui/useRecuperarFoco.ts'

function Fila({ estado }: { readonly estado: string }) {
  const titulo = useRecuperarFoco<HTMLHeadingElement>(estado)

  return (
    <>
      <h3 ref={titulo} tabIndex={-1}>
        Título
      </h3>
      {estado === 'pendiente' && <button type="button">Pedir</button>}
      <input aria-label="Otro campo" />
    </>
  )
}

function titulo() {
  return screen.getByRole('heading', { name: 'Título' })
}

describe('useRecuperarFoco', () => {
  it('al abrir no mueve el foco', () => {
    render(<Fila estado="pendiente" />)

    expect(titulo()).not.toHaveFocus()
  })

  it('si el botón con el foco desaparece al cambiar el estado, el foco pasa al título', () => {
    const { rerender } = render(<Fila estado="pendiente" />)
    screen.getByRole('button', { name: 'Pedir' }).focus()

    rerender(<Fila estado="autorizado" />)

    expect(titulo()).toHaveFocus()
  })

  it('no le quita el foco a quien lo tenga en otra parte', () => {
    const { rerender } = render(<Fila estado="pendiente" />)
    screen.getByRole('textbox', { name: 'Otro campo' }).focus()

    rerender(<Fila estado="autorizado" />)

    expect(screen.getByRole('textbox', { name: 'Otro campo' })).toHaveFocus()
  })

  it('si el estado no cambia, no mueve el foco', () => {
    const { rerender } = render(<Fila estado="pendiente" />)

    rerender(<Fila estado="pendiente" />)

    expect(titulo()).not.toHaveFocus()
  })
})
