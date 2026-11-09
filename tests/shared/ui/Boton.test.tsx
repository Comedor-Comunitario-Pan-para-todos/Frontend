import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Boton } from '@/shared/ui/Boton.tsx'

describe('Boton', () => {
  it('muestra su texto y responde al clic', async () => {
    const alHacerClic = vi.fn()
    render(<Boton onClick={alHacerClic}>Guardar</Boton>)

    await userEvent.click(screen.getByRole('button', { name: 'Guardar' }))

    expect(alHacerClic).toHaveBeenCalledOnce()
  })

  it('por defecto no envía formularios', () => {
    render(<Boton>Guardar</Boton>)

    expect(screen.getByRole('button')).toHaveAttribute('type', 'button')
  })

  it('permite ser el botón de envío', () => {
    render(<Boton type="submit">Entrar</Boton>)

    expect(screen.getByRole('button')).toHaveAttribute('type', 'submit')
  })

  it('mientras carga se bloquea, conserva el texto y lo anuncia', async () => {
    const alHacerClic = vi.fn()
    render(
      <Boton cargando onClick={alHacerClic}>
        Guardar
      </Boton>,
    )
    const boton = screen.getByRole('button', { name: 'Guardar' })

    await userEvent.click(boton)

    expect(boton).toBeDisabled()
    expect(boton).toHaveAttribute('aria-busy', 'true')
    expect(alHacerClic).not.toHaveBeenCalled()
  })

  it('deshabilitado no anuncia carga', () => {
    render(<Boton disabled>Guardar</Boton>)
    const boton = screen.getByRole('button')

    expect(boton).toBeDisabled()
    expect(boton).not.toHaveAttribute('aria-busy')
  })
})
