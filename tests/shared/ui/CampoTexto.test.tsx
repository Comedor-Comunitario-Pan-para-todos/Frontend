import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Search } from 'lucide-react'
import { createRef } from 'react'
import { describe, expect, it } from 'vitest'
import { CampoTexto } from '@/shared/ui/CampoTexto.tsx'

describe('CampoTexto', () => {
  it('asocia la etiqueta con el campo y permite escribir', async () => {
    render(<CampoTexto etiqueta="Correo" />)
    const campo = screen.getByLabelText('Correo')

    await userEvent.type(campo, 'ana@comedor.org')

    expect(campo).toHaveValue('ana@comedor.org')
  })

  it('genera un id distinto para cada campo', () => {
    render(
      <>
        <CampoTexto etiqueta="Correo" />
        <CampoTexto etiqueta="Nombre" />
      </>,
    )

    expect(screen.getByLabelText('Correo').id).not.toBe(screen.getByLabelText('Nombre').id)
  })

  it('respeta el id indicado', () => {
    render(<CampoTexto etiqueta="Correo" id="correo" />)

    expect(screen.getByLabelText('Correo')).toHaveAttribute('id', 'correo')
  })

  it('describe el campo con la ayuda', () => {
    render(<CampoTexto etiqueta="Correo" ayuda="El que registró" />)
    const campo = screen.getByLabelText('Correo')

    expect(campo).toHaveAccessibleDescription('El que registró')
    expect(campo).not.toHaveAttribute('aria-invalid')
  })

  it('marca el error y lo usa como descripción en lugar de la ayuda', () => {
    render(<CampoTexto etiqueta="Correo" ayuda="El que registró" error="Correo no válido" />)
    const campo = screen.getByLabelText('Correo')

    expect(campo).toHaveAttribute('aria-invalid', 'true')
    expect(campo).toHaveAccessibleDescription('Correo no válido')
    expect(screen.queryByText('El que registró')).not.toBeInTheDocument()
  })

  it('sin ayuda ni error no tiene descripción', () => {
    render(<CampoTexto etiqueta="Correo" />)

    expect(screen.getByLabelText('Correo')).not.toHaveAttribute('aria-describedby')
  })

  it('suma la nota de la etiqueta a la descripción del campo', () => {
    render(<CampoTexto etiqueta="Barrio" nota="Opcional" ayuda="No condiciona la entrega." />)

    expect(screen.getByText('Opcional')).toBeInTheDocument()
    expect(screen.getByLabelText('Barrio')).toHaveAccessibleDescription(
      'Opcional No condiciona la entrega.',
    )
  })

  it('la nota no cambia el nombre del campo', () => {
    render(<CampoTexto etiqueta="Nombres" nota="Obligatorio" />)

    expect(screen.getByRole('textbox', { name: 'Nombres' })).toBeInTheDocument()
  })

  it('el ícono es decorativo: no cambia el nombre ni la descripción', () => {
    const { container } = render(<CampoTexto etiqueta="Buscar" icono={Search} />)
    const campo = screen.getByRole('textbox', { name: 'Buscar' })

    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true')
    expect(campo).not.toHaveAttribute('aria-describedby')
  })

  it('entrega la referencia al input, como necesita React Hook Form', () => {
    const referencia = createRef<HTMLInputElement>()
    render(<CampoTexto etiqueta="Correo" ref={referencia} />)

    expect(referencia.current).toBe(screen.getByLabelText('Correo'))
  })
})
