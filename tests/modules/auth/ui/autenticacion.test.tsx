import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { beforeEach, describe, expect, it } from 'vitest'
import { CLAVE_MOCK, handlers } from '@/mocks/handlers.ts'
import { iniciarSesionDePrueba, renderizarApp } from '../../../app/renderizarApp.tsx'
import { servidor } from '../../../mocks/servidor.ts'

async function ingresar(email: string, clave: string) {
  await userEvent.type(await screen.findByLabelText('Correo electrónico'), email)
  await userEvent.type(screen.getByLabelText('Contraseña'), clave)
  await userEvent.click(screen.getByRole('button', { name: 'Ingresar' }))
}

describe('autenticación', () => {
  beforeEach(() => {
    localStorage.clear()
    servidor.use(...handlers)
  })

  it('sin sesión lleva al login', async () => {
    const enrutador = renderizarApp('/turnos')

    expect(await screen.findByRole('heading', { name: 'Iniciar sesión' })).toBeInTheDocument()
    expect(enrutador.state.location.pathname).toBe('/login')
  })

  it('al ingresar vuelve a la pantalla que se había pedido', async () => {
    renderizarApp('/turnos')

    await ingresar('voluntario@comedor.test', CLAVE_MOCK)

    expect(await screen.findByRole('heading', { name: 'Turnos' })).toBeInTheDocument()
  })

  it('con credenciales incorrectas muestra el motivo y sigue en el login', async () => {
    renderizarApp('/login')

    await ingresar('voluntario@comedor.test', 'otra-clave')

    expect(await screen.findByRole('alert')).toHaveTextContent('Credenciales inválidas')
    expect(screen.getByRole('heading', { name: 'Iniciar sesión' })).toBeInTheDocument()
  })

  it('valida el formulario antes de llamar al servidor', async () => {
    renderizarApp('/login')

    await userEvent.click(await screen.findByRole('button', { name: 'Ingresar' }))

    expect(await screen.findByText('Escriba un correo válido.')).toBeInTheDocument()
    expect(screen.getByText('Escriba su contraseña.')).toBeInTheDocument()
  })

  it('tolera espacios al final del correo', async () => {
    renderizarApp('/')

    await ingresar('voluntario@comedor.test ', CLAVE_MOCK)

    expect(await screen.findByRole('heading', { name: 'Inicio' })).toBeInTheDocument()
  })

  it('con sesión guardada entra directo', async () => {
    iniciarSesionDePrueba()

    renderizarApp('/reportes')

    expect(await screen.findByRole('heading', { name: 'Reportes' })).toBeInTheDocument()
  })

  it('con sesión activa el login redirige al inicio', async () => {
    iniciarSesionDePrueba()

    const enrutador = renderizarApp('/login')

    await waitFor(() => expect(enrutador.state.location.pathname).toBe('/'))
  })

  it('si no se puede verificar la sesión permite reintentar sin perderla', async () => {
    iniciarSesionDePrueba()
    servidor.use(
      http.get(
        '*/auth/me',
        () => HttpResponse.json({ statusCode: 500, message: 'Error' }, { status: 500 }),
        { once: true },
      ),
    )
    renderizarApp('/turnos')

    expect(await screen.findByText('No pudimos verificar su sesión')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }))

    expect(await screen.findByRole('heading', { name: 'Turnos' })).toBeInTheDocument()
  })
})
