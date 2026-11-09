import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { CampoContrasena } from '@/shared/ui/CampoContrasena.tsx'

describe('CampoContrasena', () => {
  it('oculta la contraseña y permite mostrarla sin enviar el formulario', async () => {
    render(<CampoContrasena etiqueta="Contraseña" />)
    const campo = screen.getByLabelText('Contraseña')

    expect(campo).toHaveAttribute('type', 'password')

    const boton = screen.getByRole('button', { name: 'Mostrar contraseña' })
    expect(boton).toHaveAttribute('type', 'button')
    await userEvent.click(boton)

    expect(campo).toHaveAttribute('type', 'text')

    await userEvent.click(screen.getByRole('button', { name: 'Ocultar contraseña' }))

    expect(campo).toHaveAttribute('type', 'password')
  })
})
