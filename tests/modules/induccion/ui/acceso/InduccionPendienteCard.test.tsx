import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { beforeEach, describe, expect, it } from 'vitest'
import { handlers } from '@/mocks/handlers.ts'
import { MODULOS_INDUCCION, reiniciarInduccionMock } from '@/mocks/induccion.ts'
import { iniciarSesionDePrueba, renderizarApp } from '../../../../app/renderizarApp.tsx'
import { servidor } from '../../../../mocks/servidor.ts'

const VOLUNTARIO = 'mock-token.mock-3'
const DONANTE = 'mock-token.mock-4'

function responderGuia(modulosLeidos: string[]) {
  servidor.use(
    http.get('*/api/induccion', () =>
      HttpResponse.json({ modulos: MODULOS_INDUCCION, progreso: { modulosLeidos } }),
    ),
  )
}

describe('acceso a la guía desde el Inicio', () => {
  beforeEach(() => {
    localStorage.clear()
    reiniciarInduccionMock()
    servidor.use(...handlers)
  })

  it('muestra cuánto le falta al voluntario y lo lleva a la guía', async () => {
    const usuario = userEvent.setup()
    iniciarSesionDePrueba(VOLUNTARIO)
    const enrutador = renderizarApp('/')

    const tarjeta = await screen.findByRole('region', { name: 'Tu guía de inducción' })
    expect(tarjeta).toHaveTextContent('Te faltan 3 de 4 temas · unos 7 minutos')

    await usuario.click(within(tarjeta).getByRole('link', { name: 'Continuar la guía' }))

    expect(enrutador.state.location.pathname).toBe('/induccion')
    expect(await screen.findByRole('heading', { name: 'Guía de inducción' })).toBeVisible()
  })

  it('invita a empezar si todavía no ha leído ningún tema', async () => {
    responderGuia([])
    iniciarSesionDePrueba(VOLUNTARIO)
    renderizarApp('/')

    const tarjeta = await screen.findByRole('region', { name: 'Tu guía de inducción' })
    expect(tarjeta).toHaveTextContent('4 temas cortos · unos 9 minutos')
    expect(within(tarjeta).getByRole('link', { name: 'Empezar la guía' })).toBeVisible()
  })

  it('desaparece cuando ya terminó la inducción', async () => {
    responderGuia(MODULOS_INDUCCION.map((m) => m.id))
    iniciarSesionDePrueba(VOLUNTARIO)
    renderizarApp('/')

    expect(await screen.findByRole('heading', { name: 'Inicio' })).toBeVisible()
    await new Promise((resolver) => setTimeout(resolver, 50))
    expect(screen.queryByRole('region', { name: 'Tu guía de inducción' })).not.toBeInTheDocument()
  })

  it('no aparece para quien no tiene la guía', async () => {
    iniciarSesionDePrueba(DONANTE)
    renderizarApp('/')

    expect(await screen.findByRole('heading', { name: 'Inicio' })).toBeVisible()
    expect(screen.queryByRole('region', { name: 'Tu guía de inducción' })).not.toBeInTheDocument()
  })
})
