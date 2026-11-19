import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { PoliticaTratamiento } from '@/modules/beneficiarios/ui/datosSensibles/PoliticaTratamiento.tsx'

const DERECHOS = /Puede conocer, corregir o pedir que se borren sus datos/

describe('PoliticaTratamiento', () => {
  it('muestra el resumen y la versión de la política', () => {
    render(<PoliticaTratamiento />)

    expect(screen.getByText(/Sus datos se usan solo para darle la ración/)).toBeInTheDocument()
    expect(screen.getByText('Política de datos · versión 1')).toBeInTheDocument()
  })

  it('el texto completo aparece al tocar «Leer la política completa»', async () => {
    render(<PoliticaTratamiento />)

    expect(screen.getByText(DERECHOS)).not.toBeVisible()

    await userEvent.click(screen.getByText('Leer la política completa'))

    expect(screen.getByText(DERECHOS)).toBeVisible()
    expect(screen.getByText('Sus derechos')).toBeVisible()
  })
})
