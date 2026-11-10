import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createRef } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { CasillaVerificacion } from '@/shared/ui/CasillaVerificacion.tsx'

describe('CasillaVerificacion', () => {
  it('empieza desmarcada y se marca al tocar su texto', async () => {
    render(<CasillaVerificacion etiqueta="Se informó al comensal" />)
    const casilla = screen.getByRole('checkbox', { name: 'Se informó al comensal' })

    expect(casilla).not.toBeChecked()

    await userEvent.click(screen.getByText('Se informó al comensal'))

    expect(casilla).toBeChecked()
  })

  it('avisa cada cambio', async () => {
    const alCambiar = vi.fn()
    render(<CasillaVerificacion etiqueta="Sin documento" onChange={alCambiar} />)

    await userEvent.click(screen.getByRole('checkbox'))

    expect(alCambiar).toHaveBeenCalledTimes(1)
  })

  it('describe la casilla con el texto de apoyo', () => {
    render(
      <CasillaVerificacion etiqueta="Sin documento" descripcion="No impide recibir la ración." />,
    )

    expect(screen.getByRole('checkbox')).toHaveAccessibleDescription('No impide recibir la ración.')
  })

  it('su nombre es solo la etiqueta, aunque tenga texto de apoyo', () => {
    render(
      <CasillaVerificacion etiqueta="Sin documento" descripcion="No impide recibir la ración." />,
    )

    expect(screen.getByRole('checkbox', { name: 'Sin documento' })).toBeInTheDocument()
  })

  it('marca el error y lo suma a la descripción', () => {
    render(
      <CasillaVerificacion
        etiqueta="Se informó al comensal"
        descripcion="Ley 1581 de 2012."
        error="Confirme que informó al comensal."
      />,
    )
    const casilla = screen.getByRole('checkbox')

    expect(casilla).toHaveAttribute('aria-invalid', 'true')
    expect(casilla).toHaveAccessibleDescription(
      'Ley 1581 de 2012. Confirme que informó al comensal.',
    )
  })

  it('sin apoyo ni error no tiene descripción', () => {
    render(<CasillaVerificacion etiqueta="Sin documento" />)
    const casilla = screen.getByRole('checkbox')

    expect(casilla).not.toHaveAttribute('aria-describedby')
    expect(casilla).not.toHaveAttribute('aria-invalid')
  })

  it('deshabilitada no se puede marcar', async () => {
    render(<CasillaVerificacion etiqueta="Sin documento" disabled />)
    const casilla = screen.getByRole('checkbox')

    await userEvent.click(casilla)

    expect(casilla).not.toBeChecked()
  })

  it('entrega la referencia al input, como necesita React Hook Form', () => {
    const referencia = createRef<HTMLInputElement>()
    render(<CasillaVerificacion etiqueta="Sin documento" ref={referencia} />)

    expect(referencia.current).toBe(screen.getByRole('checkbox'))
  })
})
