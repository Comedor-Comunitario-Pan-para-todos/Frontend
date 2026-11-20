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

function abrirGuia(token = VOLUNTARIO) {
  iniciarSesionDePrueba(token)
  return renderizarApp('/induccion')
}

function tema(nombre: RegExp) {
  return screen.getByRole('button', { name: nombre })
}

function avance() {
  return screen.getByRole('region', { name: 'Su avance' })
}

describe('guía de inducción', () => {
  beforeEach(() => {
    localStorage.clear()
    reiniciarInduccionMock()
    servidor.use(...handlers)
  })

  it('muestra los temas y abre el primero que falta por leer', async () => {
    abrirGuia()

    expect(
      await screen.findByRole('heading', { name: 'Guía de inducción', level: 1 }),
    ).toBeVisible()
    expect(
      await screen.findByText(/4 temas cortos para su primer turno · unos 9 minutos/),
    ).toBeVisible()
    expect(within(avance()).getByText('1 de 4 temas')).toBeVisible()
    expect(within(avance()).getByRole('progressbar')).toHaveAttribute('value', '1')

    expect(tema(/Higiene antes de servir/)).toHaveAttribute('aria-expanded', 'false')
    expect(tema(/Trato digno a las personas/)).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByText(/Sirva la misma porción a todos/)).toBeVisible()
    expect(screen.getByRole('checkbox', { name: 'Ya leí este tema' })).not.toBeChecked()
  })

  it('al marcar un tema guarda el avance y abre el siguiente', async () => {
    const usuario = userEvent.setup()
    abrirGuia()

    await usuario.click(await screen.findByRole('checkbox', { name: 'Ya leí este tema' }))

    expect(await within(avance()).findByText('2 de 4 temas')).toBeVisible()
    expect(tema(/Trato digno a las personas/)).toHaveAttribute('aria-expanded', 'false')
    expect(tema(/Manejo seguro de los alimentos/)).toHaveAttribute('aria-expanded', 'true')
  })

  it('si el guardado falla, desmarca el tema, avisa con la Constancia y permite reintentar', async () => {
    const usuario = userEvent.setup()
    abrirGuia()

    await usuario.click(
      await screen.findByRole('button', { name: /Manejo seguro de los alimentos/ }),
    )
    await usuario.click(screen.getByRole('checkbox', { name: 'Ya leí este tema' }))

    expect(await screen.findByText('No se guardó la lectura del tema')).toBeVisible()
    expect(
      screen.getByText(
        '«Manejo seguro de los alimentos» sigue sin marcar. Revise su conexión e inténtelo de nuevo.',
      ),
    ).toBeVisible()
    expect(screen.getByRole('checkbox', { name: 'Ya leí este tema' })).not.toBeChecked()
    expect(tema(/Manejo seguro de los alimentos/)).toHaveAttribute('aria-expanded', 'true')
    expect(within(avance()).getByText('1 de 4 temas')).toBeVisible()

    await usuario.click(screen.getByRole('button', { name: 'Reintentar' }))

    expect(await within(avance()).findByText('2 de 4 temas')).toBeVisible()
    expect(screen.queryByText('No se guardó la lectura del tema')).not.toBeInTheDocument()
    expect(tema(/Qué hacer en una emergencia/)).toHaveAttribute('aria-expanded', 'false')
    expect(tema(/Trato digno a las personas/)).toHaveAttribute('aria-expanded', 'true')
  })

  it('felicita al voluntario cuando ya leyó todos los temas', async () => {
    servidor.use(
      http.get('*/api/induccion', () =>
        HttpResponse.json({
          modulos: MODULOS_INDUCCION,
          progreso: { modulosLeidos: MODULOS_INDUCCION.map((m) => m.id) },
        }),
      ),
    )
    abrirGuia()

    expect(await screen.findByText('¡Terminó la inducción!')).toBeVisible()
    expect(within(avance()).getByText('Completó 4 temas')).toBeVisible()
    expect(screen.getByRole('link', { name: 'Ir al inicio' })).toHaveAttribute('href', '/')
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument()
  })

  it('permite abrir un tema ya leído y desmarcarlo', async () => {
    const usuario = userEvent.setup()
    abrirGuia()

    await usuario.click(await screen.findByRole('button', { name: /Higiene antes de servir/ }))
    expect(tema(/Trato digno a las personas/)).toHaveAttribute('aria-expanded', 'false')
    await usuario.click(screen.getByRole('checkbox', { name: 'Ya leí este tema' }))

    expect(await within(avance()).findByText('0 de 4 temas')).toBeVisible()
  })

  it('si la guía no carga, muestra el error y la vuelve a pedir', async () => {
    const usuario = userEvent.setup()
    servidor.use(
      http.get('*/api/induccion', () => HttpResponse.json({ message: 'caído' }, { status: 500 }), {
        once: true,
      }),
    )
    abrirGuia()

    const aviso = await screen.findByRole('alert')
    expect(aviso).toHaveTextContent('No pudimos cargar la guía')

    await usuario.click(within(aviso).getByRole('button', { name: 'Reintentar' }))

    expect(await screen.findByRole('button', { name: /Higiene antes de servir/ })).toBeVisible()
  })

  it('avisa cuando la coordinadora todavía no ha cargado temas', async () => {
    servidor.use(
      http.get('*/api/induccion', () =>
        HttpResponse.json({ modulos: [], progreso: { modulosLeidos: [] } }),
      ),
    )
    abrirGuia()

    expect(await screen.findByText('Todavía no hay temas')).toBeVisible()
    expect(screen.queryByRole('region', { name: 'Su avance' })).not.toBeInTheDocument()
  })

  it('un donante no puede entrar a la guía', async () => {
    abrirGuia(DONANTE)

    expect(await screen.findByText('Esta sección no está habilitada para su perfil')).toBeVisible()
  })
})
