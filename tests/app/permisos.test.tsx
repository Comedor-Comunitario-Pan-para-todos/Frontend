import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { handlers } from '@/mocks/handlers.ts'
import { servidor } from '../mocks/servidor.ts'
import { iniciarSesionDePrueba, renderizarApp } from './renderizarApp.tsx'

const TITULO_SIN_ACCESO = 'Esta sección no está habilitada para su perfil'

const COORDINADORA = 'mock-token.mock-1'
const PRESIDENTE = 'mock-token.mock-2'
const VOLUNTARIO = 'mock-token.mock-3'
const DONANTE = 'mock-token.mock-4'

describe('permisos por rol', () => {
  beforeEach(() => {
    localStorage.clear()
    servidor.use(...handlers)
  })

  it.each([
    ['Coordinadora', COORDINADORA, ['Inicio', 'Turnos', 'Beneficiarios', 'Inventario', 'Reportes']],
    ['Presidente', PRESIDENTE, ['Inicio', 'Reportes']],
    ['Voluntario', VOLUNTARIO, ['Inicio', 'Turnos', 'Beneficiarios', 'Inventario']],
    ['Donante', DONANTE, ['Inicio', 'Aportes', 'Reportes']],
  ])('el menú de %s solo muestra sus módulos', async (_rol, token, esperados) => {
    iniciarSesionDePrueba(token)

    renderizarApp('/')

    await screen.findByRole('heading', { name: 'Inicio' })
    const menu = screen.getByRole('navigation', { name: 'Principal' })
    const enlaces = within(menu).getAllByRole('link')
    expect(enlaces.map((enlace) => enlace.textContent)).toEqual(esperados)
  })

  it.each([
    ['Presidente', PRESIDENTE, '/beneficiarios'],
    ['Voluntario', VOLUNTARIO, '/reportes'],
    ['Donante', DONANTE, '/turnos'],
    ['Coordinadora', COORDINADORA, '/aportes'],
  ])('%s no entra por la dirección a %s', async (_rol, token, ruta) => {
    iniciarSesionDePrueba(token)

    const enrutador = renderizarApp(ruta)

    expect(await screen.findByRole('heading', { name: TITULO_SIN_ACCESO })).toBeInTheDocument()
    expect(screen.getByText('403')).toBeInTheDocument()
    expect(enrutador.state.location.pathname).toBe(ruta)
  })

  it('desde la página de acceso denegado se puede volver al inicio', async () => {
    iniciarSesionDePrueba(DONANTE)
    renderizarApp('/inventario')

    await userEvent.click(await screen.findByRole('link', { name: 'Volver al inicio' }))

    expect(await screen.findByRole('heading', { name: 'Inicio' })).toBeInTheDocument()
  })
})
