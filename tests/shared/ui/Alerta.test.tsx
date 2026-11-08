import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Alerta } from '@/shared/ui/Alerta.tsx'

describe('Alerta', () => {
  it('anuncia de inmediato un peligro', () => {
    render(<Alerta tipo="peligro">No se pudo guardar</Alerta>)

    expect(screen.getByRole('alert')).toHaveTextContent('No se pudo guardar')
  })

  it.each(['exito', 'aviso', 'privacidad'] as const)('%s se anuncia sin interrumpir', (tipo) => {
    render(<Alerta tipo={tipo}>Mensaje</Alerta>)

    expect(screen.getByRole('status')).toHaveTextContent('Mensaje')
  })

  it('muestra el título junto al mensaje', () => {
    render(
      <Alerta tipo="aviso" titulo="Próximo a caducar">
        Arroz, lote 12
      </Alerta>,
    )

    expect(screen.getByText('Próximo a caducar')).toBeInTheDocument()
    expect(screen.getByText('Arroz, lote 12')).toBeInTheDocument()
  })

  it('siempre acompaña el color con un ícono, oculto para lectores de pantalla', () => {
    render(<Alerta tipo="exito">Guardado</Alerta>)

    expect(screen.getByRole('status').querySelector('svg')).toHaveAttribute('aria-hidden', 'true')
  })
})
