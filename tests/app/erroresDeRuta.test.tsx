import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter } from 'react-router'
import { RouterProvider } from 'react-router/dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { rutas } from '@/app/rutas.tsx'

const fallos = vi.hoisted(() => ({ falloEnMenu: false }))

vi.mock('@/app/paginas/PaginaProximamente.tsx', () => ({
  PaginaProximamente: ({ modulo }: { readonly modulo: string }) => {
    if (modulo === 'Reportes') throw new Error('Fallo de prueba')
    return <h1>{modulo}</h1>
  },
}))

vi.mock('@/app/layout/NavegacionPrincipal.tsx', async (original) => {
  const modulo = await original<typeof import('@/app/layout/NavegacionPrincipal.tsx')>()
  return {
    NavegacionPrincipal: () => {
      if (fallos.falloEnMenu) throw new Error('Fallo de prueba')
      return <modulo.NavegacionPrincipal />
    },
  }
})

function renderizarEn(ruta: string) {
  render(<RouterProvider router={createMemoryRouter(rutas, { initialEntries: [ruta] })} />)
}

describe('errores de ruta', () => {
  beforeEach(() => {
    fallos.falloEnMenu = false
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('si falla una pantalla conserva el menú y permite salir a otro módulo', async () => {
    renderizarEn('/reportes')

    expect(
      await screen.findByRole('heading', { name: 'No pudimos mostrar esta pantalla' }),
    ).toBeInTheDocument()

    await userEvent.click(screen.getByRole('link', { name: 'Turnos' }))

    expect(await screen.findByRole('heading', { name: 'Turnos' })).toBeInTheDocument()
  })

  it('si falla el layout muestra el error sin menú', async () => {
    fallos.falloEnMenu = true

    renderizarEn('/')

    expect(
      await screen.findByRole('heading', { name: 'No pudimos mostrar esta pantalla' }),
    ).toBeInTheDocument()
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument()
  })
})
