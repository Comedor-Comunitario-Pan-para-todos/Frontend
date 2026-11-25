import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { handlers } from '@/mocks/handlers.ts'
import { servidor } from '../mocks/servidor.ts'
import { iniciarSesionDePrueba, renderizarApp as renderizarEn } from './renderizarApp.tsx'

describe('rutas', () => {
  beforeEach(() => {
    localStorage.clear()
    servidor.use(...handlers)
    iniciarSesionDePrueba()
  })

  it('muestra el inicio en la raíz', async () => {
    renderizarEn('/')

    expect(await screen.findByRole('heading', { name: 'Inicio' })).toBeInTheDocument()
    expect(await screen.findByText('Su guía de inducción')).toBeInTheDocument()
  })

  it.each([
    ['/turnos', 'Turnos de hoy'],
    ['/beneficiarios', 'Beneficiarios'],
    ['/inventario', 'Inventario'],
    ['/reportes', 'Reportes'],
  ])('%s muestra su módulo', async (ruta, nombre) => {
    renderizarEn(ruta)

    expect(await screen.findByRole('heading', { name: nombre })).toBeInTheDocument()
  })

  it('una dirección desconocida muestra la página no encontrada y permite volver', async () => {
    renderizarEn('/no-existe')

    await userEvent.click(await screen.findByRole('link', { name: 'Volver al inicio' }))

    expect(await screen.findByRole('heading', { name: 'Inicio' })).toBeInTheDocument()
  })

  it('la navegación marca el módulo actual y permite cambiar de módulo', async () => {
    renderizarEn('/turnos')

    expect(await screen.findByRole('link', { name: 'Turnos' })).toHaveAttribute(
      'aria-current',
      'page',
    )
    expect(screen.getByRole('link', { name: 'Inicio' })).not.toHaveAttribute('aria-current')

    await userEvent.click(screen.getByRole('link', { name: 'Reportes' }))

    expect(await screen.findByRole('heading', { name: 'Reportes' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Reportes' })).toHaveAttribute('aria-current', 'page')
  })

  it('al cambiar de pantalla la nueva abre arriba', async () => {
    const desplazar = vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
    renderizarEn('/turnos')
    await screen.findByRole('heading', { name: 'Turnos de hoy' })
    desplazar.mockClear()

    await userEvent.click(screen.getByRole('link', { name: 'Reportes' }))
    await screen.findByRole('heading', { name: 'Reportes' })

    expect(desplazar).toHaveBeenCalledWith(0, 0)
    desplazar.mockRestore()
  })
})
