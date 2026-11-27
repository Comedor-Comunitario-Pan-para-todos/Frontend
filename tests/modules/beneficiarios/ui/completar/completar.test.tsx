import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { beforeEach, describe, expect, it } from 'vitest'
import { reiniciarBeneficiariosMock } from '@/mocks/beneficiarios.ts'
import { handlers } from '@/mocks/handlers.ts'
import {
  crearClienteDePrueba,
  iniciarSesionDePrueba,
  renderizarApp,
} from '../../../../app/renderizarApp.tsx'
import { servidor } from '../../../../mocks/servidor.ts'

const COORDINADORA = 'mock-token.mock-1'
const VOLUNTARIO = 'mock-token.mock-3'
const ID_MARIA = '00000000-0000-4000-8000-000000000001'
const ID_CARLOS = '00000000-0000-4000-8000-000000000002'
const ID_PEDRO = '00000000-0000-4000-8000-000000000008'

function dato(nombre: string) {
  return screen.getByText(nombre, { selector: 'dt' }).nextElementSibling!
}

async function escribir(campo: string, texto: string) {
  await userEvent.type(screen.getByLabelText(campo), texto, { delay: null })
}

async function guardar() {
  await userEvent.click(screen.getByRole('button', { name: 'Guardar datos' }))
}

async function completarSinDocumento() {
  await userEvent.click(screen.getByRole('checkbox', { name: 'Sin documento' }))
  await userEvent.click(screen.getByRole('checkbox', { name: 'Informé al adulto que lo acompaña' }))
  await guardar()
}

describe('completar datos extendidos', () => {
  beforeEach(() => {
    localStorage.clear()
    reiniciarBeneficiariosMock()
    servidor.use(...handlers)
  })

  it('desde la ficha básica se completan y la ficha pasa a extendida', async () => {
    iniciarSesionDePrueba(COORDINADORA)
    const enrutador = renderizarApp(`/beneficiarios/${ID_CARLOS}`)

    await userEvent.click(await screen.findByRole('link', { name: 'Completar datos' }))
    await screen.findByRole('heading', { name: 'Completar datos' })
    await userEvent.click(screen.getByRole('radio', { name: 'Tarjeta de identidad' }))
    await escribir('Número de documento', '1086999888')
    await escribir('Teléfono', '3151234567')
    await userEvent.click(
      screen.getByRole('checkbox', { name: 'Informé al adulto que lo acompaña' }),
    )
    await guardar()

    expect(await screen.findByText('Datos completados')).toBeInTheDocument()
    expect(await screen.findByText('Registro extendido')).toBeInTheDocument()
    expect(dato('Documento')).toHaveTextContent('TI 1.086.999.888')
    expect(dato('Teléfono')).toHaveTextContent('3151234567')
    expect(enrutador.state.location.pathname).toBe(`/beneficiarios/${ID_CARLOS}`)
  })

  it('a un adulto le pide su propia autorización', async () => {
    iniciarSesionDePrueba(VOLUNTARIO)
    renderizarApp(`/beneficiarios/${ID_PEDRO}/completar`)
    expect(
      await screen.findByRole('checkbox', { name: 'Informé a la persona' }),
    ).toBeInTheDocument()
  })

  it('guarda la autorización que se pidió al completar', async () => {
    iniciarSesionDePrueba(VOLUNTARIO)
    const cliente = crearClienteDePrueba()
    renderizarApp(`/beneficiarios/${ID_CARLOS}/completar`, cliente)
    await screen.findByRole('button', { name: 'Guardar datos' })

    await completarSinDocumento()
    await screen.findByText('Registro extendido')
    await waitFor(() => expect(cliente.isFetching()).toBe(0))

    const autorizacion = screen.getByRole('region', { name: 'Uso de datos' })
    expect(await within(autorizacion).findByText('Autorizado')).toBeInTheDocument()
  })

  it('si no se guarda la autorización, lleva a la ficha y deja reintentar solo eso', async () => {
    let completados = 0
    servidor.use(
      http.patch('*/api/beneficiarios/:id', () => {
        completados += 1
        return undefined
      }),
      http.post(
        '*/api/beneficiarios/:id/consentimiento',
        () => HttpResponse.json({ statusCode: 500, message: 'Error' }, { status: 500 }),
        { once: true },
      ),
    )
    iniciarSesionDePrueba(VOLUNTARIO)
    renderizarApp(`/beneficiarios/${ID_CARLOS}/completar`)
    await screen.findByRole('button', { name: 'Guardar datos' })

    await completarSinDocumento()

    expect(await screen.findByText('No se guardó la autorización')).toBeInTheDocument()
    expect(await screen.findByText('Registro extendido')).toBeInTheDocument()
    expect(screen.queryByText('Datos completados')).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }))

    expect(await screen.findByText('Datos completados')).toBeInTheDocument()
    expect(completados).toBe(1)
  })

  it('pide el documento o «Sin documento» y la autorización', async () => {
    iniciarSesionDePrueba(VOLUNTARIO)
    renderizarApp(`/beneficiarios/${ID_CARLOS}/completar`)
    await screen.findByRole('button', { name: 'Guardar datos' })

    await guardar()

    expect(
      await screen.findByText('Escriba el número o marque «Sin documento».'),
    ).toBeInTheDocument()
    expect(
      screen.getByText('Marque la casilla después de explicar la política de datos.'),
    ).toBeInTheDocument()
  })

  it('avisa mientras se escribe si el documento ya es de otra persona', async () => {
    iniciarSesionDePrueba(VOLUNTARIO)
    renderizarApp(`/beneficiarios/${ID_CARLOS}/completar`)
    await screen.findByRole('button', { name: 'Guardar datos' })

    await escribir('Número de documento', '42.185.390')

    const sensibles = screen.getByRole('region', { name: 'Datos sensibles' })
    expect(
      await within(sensibles).findByText(
        'Ese documento ya es de otra persona',
        {},
        { timeout: 3000 },
      ),
    ).toBeInTheDocument()
    expect(
      within(sensibles).getByRole('heading', { name: 'María Elena Restrepo' }),
    ).toBeInTheDocument()
  })

  it('si el servidor responde que el documento es de otra persona, lo dice y conserva lo escrito', async () => {
    servidor.use(
      http.get('*/beneficiarios/validar-documento/:numero', () =>
        HttpResponse.json({ existe: false, beneficiario: null }),
      ),
    )
    iniciarSesionDePrueba(VOLUNTARIO)
    renderizarApp(`/beneficiarios/${ID_CARLOS}/completar`)
    await screen.findByRole('button', { name: 'Guardar datos' })

    await escribir('Número de documento', '42185390')
    await userEvent.click(
      screen.getByRole('checkbox', { name: 'Informé al adulto que lo acompaña' }),
    )
    await guardar()

    const sensibles = screen.getByRole('region', { name: 'Datos sensibles' })
    expect(
      await within(sensibles).findByText('Ese documento ya es de otra persona'),
    ).toBeInTheDocument()
    expect(screen.getByLabelText('Número de documento')).toHaveValue('42185390')
    expect(screen.getByLabelText('Número de documento')).toHaveFocus()
  })

  it('no ofrece completar a quien ya está en nivel extendido', async () => {
    iniciarSesionDePrueba(VOLUNTARIO)
    renderizarApp(`/beneficiarios/${ID_MARIA}/completar`)

    expect(await screen.findByText('Esta persona ya tiene registro extendido')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Guardar datos' })).not.toBeInTheDocument()
  })
})
