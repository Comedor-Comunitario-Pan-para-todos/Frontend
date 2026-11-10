import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { SelectorOpciones } from '@/shared/ui/SelectorOpciones.tsx'

const TIPOS = [
  { valor: 'CC', etiqueta: 'CC', nombre: 'Cédula de ciudadanía' },
  { valor: 'TI', etiqueta: 'TI', nombre: 'Tarjeta de identidad' },
  { valor: 'PPT', etiqueta: 'PPT' },
]

describe('SelectorOpciones', () => {
  it('agrupa las opciones bajo su etiqueta', () => {
    render(<SelectorOpciones etiqueta="Tipo de documento" name="tipo" opciones={TIPOS} />)

    expect(screen.getByRole('group', { name: 'Tipo de documento' })).toBeInTheDocument()
    expect(screen.getAllByRole('radio')).toHaveLength(3)
  })

  it('nombra cada opción con su nombre completo, o con su texto si no lo tiene', () => {
    render(<SelectorOpciones etiqueta="Tipo de documento" name="tipo" opciones={TIPOS} />)

    expect(screen.getByRole('radio', { name: 'Cédula de ciudadanía' })).toHaveAttribute(
      'value',
      'CC',
    )
    expect(screen.getByRole('radio', { name: 'PPT' })).toHaveAttribute('value', 'PPT')
  })

  it('sin valor inicial no hay ninguna opción elegida', () => {
    render(<SelectorOpciones etiqueta="Tipo de documento" name="tipo" opciones={TIPOS} />)

    for (const opcion of screen.getAllByRole('radio')) {
      expect(opcion).not.toBeChecked()
    }
  })

  it('empieza con la opción inicial y deja elegir otra, solo una a la vez', async () => {
    const alCambiar = vi.fn()
    render(
      <SelectorOpciones
        etiqueta="Tipo de documento"
        name="tipo"
        opciones={TIPOS}
        defaultValue="CC"
        onChange={alCambiar}
      />,
    )
    const cedula = screen.getByRole('radio', { name: 'Cédula de ciudadanía' })
    const tarjeta = screen.getByRole('radio', { name: 'Tarjeta de identidad' })

    expect(cedula).toBeChecked()

    await userEvent.click(screen.getByText('TI'))

    expect(tarjeta).toBeChecked()
    expect(cedula).not.toBeChecked()
    expect(alCambiar).toHaveBeenCalledTimes(1)
  })

  it('obedece al valor cuando lo controla quien lo usa', async () => {
    function Controlado() {
      const [tipo, setTipo] = useState('TI')
      return (
        <SelectorOpciones
          etiqueta="Tipo de documento"
          name="tipo"
          opciones={TIPOS}
          value={tipo}
          onChange={(evento) => setTipo(evento.target.value)}
        />
      )
    }
    render(<Controlado />)

    expect(screen.getByRole('radio', { name: 'Tarjeta de identidad' })).toBeChecked()

    await userEvent.click(screen.getByText('PPT'))

    expect(screen.getByRole('radio', { name: 'PPT' })).toBeChecked()
  })

  it('se recorre con las flechas del teclado', async () => {
    render(
      <SelectorOpciones
        etiqueta="Tipo de documento"
        name="tipo"
        opciones={TIPOS}
        defaultValue="CC"
      />,
    )

    await userEvent.tab()
    await userEvent.keyboard('{ArrowRight}')

    expect(screen.getByRole('radio', { name: 'Tarjeta de identidad' })).toBeChecked()
  })

  it('describe el grupo con la ayuda', () => {
    render(
      <SelectorOpciones
        etiqueta="Tipo de documento"
        name="tipo"
        opciones={TIPOS}
        ayuda="Cédula de ciudadanía"
      />,
    )
    const grupo = screen.getByRole('group')

    expect(grupo).toHaveAccessibleDescription('Cédula de ciudadanía')
    expect(grupo).not.toHaveAttribute('aria-invalid')
  })

  it('marca el error y lo usa como descripción en lugar de la ayuda', () => {
    render(
      <SelectorOpciones
        etiqueta="Tipo de documento"
        name="tipo"
        opciones={TIPOS}
        ayuda="Cédula de ciudadanía"
        error="Elija el tipo de documento."
      />,
    )
    const grupo = screen.getByRole('group')

    expect(grupo).toHaveAttribute('aria-invalid', 'true')
    expect(grupo).toHaveAccessibleDescription('Elija el tipo de documento.')
    expect(screen.queryByText('Cédula de ciudadanía', { selector: 'p' })).not.toBeInTheDocument()
  })

  it('deshabilitado no deja elegir', async () => {
    render(<SelectorOpciones etiqueta="Tipo de documento" name="tipo" opciones={TIPOS} disabled />)

    await userEvent.click(screen.getByText('TI'))

    expect(screen.getByRole('radio', { name: 'Tarjeta de identidad' })).not.toBeChecked()
  })
})
