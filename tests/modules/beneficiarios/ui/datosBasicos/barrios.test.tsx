import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { beforeEach, describe, expect, it } from 'vitest'
import { reiniciarBeneficiariosMock } from '@/mocks/beneficiarios.ts'
import { handlers } from '@/mocks/handlers.ts'
import { iniciarSesionDePrueba, renderizarApp } from '../../../../app/renderizarApp.tsx'
import { servidor } from '../../../../mocks/servidor.ts'

const VOLUNTARIO = 'mock-token.mock-3'
const ID_PEDRO = '00000000-0000-4000-8000-000000000008'

function campoBarrio(): HTMLInputElement {
  return screen.getByLabelText('Barrio o sector')
}

function sugerencias(): string[] {
  const lista = screen.queryByRole('list', { name: '¿Es uno de estos barrios?' })
  if (!lista) return []
  return within(lista)
    .getAllByRole('button')
    .map((boton) => boton.textContent ?? '')
}

async function escribirBarrio(texto: string) {
  await userEvent.clear(campoBarrio())
  await userEvent.type(campoBarrio(), texto, { delay: null })
}

describe('sugerencias de barrio', () => {
  beforeEach(() => {
    localStorage.clear()
    reiniciarBeneficiariosMock()
    servidor.use(...handlers)
    iniciarSesionDePrueba(VOLUNTARIO)
  })

  it('al registrar sugiere los barrios parecidos a lo escrito', async () => {
    renderizarApp('/beneficiarios/nuevo')
    await screen.findByLabelText('Barrio o sector')
    expect(sugerencias()).toEqual([])

    await escribirBarrio('el')

    expect(await screen.findByRole('button', { name: 'El Jardín' })).toBeInTheDocument()
    expect(sugerencias()).toEqual(['El Jardín', 'El Poblado'])
    expect(screen.getByText('2 barrios parecidos')).toBeInTheDocument()
  })

  it('al tocar una sugerencia la deja escrita y vuelve al campo', async () => {
    renderizarApp('/beneficiarios/nuevo')
    await screen.findByLabelText('Barrio o sector')
    await escribirBarrio('el jardin')

    await userEvent.click(await screen.findByRole('button', { name: 'El Jardín' }))

    expect(campoBarrio()).toHaveValue('El Jardín')
    expect(campoBarrio()).toHaveFocus()
    expect(sugerencias()).toEqual([])
  })

  it('al actualizar también sugiere los barrios', async () => {
    renderizarApp(`/beneficiarios/${ID_PEDRO}/actualizar`)
    await screen.findByRole('button', { name: 'Guardar cambios' })

    await escribirBarrio('Barrio Cuba')

    expect(await screen.findByRole('button', { name: 'Cuba' })).toBeInTheDocument()
  })

  it('si no se pueden traer, el campo sigue sirviendo y se guarda igual', async () => {
    servidor.use(
      http.get('*/api/beneficiarios/barrios', () =>
        HttpResponse.json({ statusCode: 500, message: 'Error' }, { status: 500 }),
      ),
    )
    renderizarApp(`/beneficiarios/${ID_PEDRO}/actualizar`)
    await screen.findByRole('button', { name: 'Guardar cambios' })

    await escribirBarrio('Cuba')
    expect(sugerencias()).toEqual([])
    await userEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }))

    expect(await screen.findByText('Datos actualizados')).toBeInTheDocument()
  })
})
