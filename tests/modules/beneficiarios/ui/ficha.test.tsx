import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { beforeEach, describe, expect, it } from 'vitest'
import { reiniciarBeneficiariosMock } from '@/mocks/beneficiarios.ts'
import { handlers } from '@/mocks/handlers.ts'
import { iniciarSesionDePrueba, renderizarApp } from '../../../app/renderizarApp.tsx'
import { servidor } from '../../../mocks/servidor.ts'

const COORDINADORA = 'mock-token.mock-1'
const VOLUNTARIO = 'mock-token.mock-3'
const ID_MARIA = '00000000-0000-4000-8000-000000000001'
const ID_CARLOS = '00000000-0000-4000-8000-000000000002'

function abrirFicha(id: string, token = VOLUNTARIO) {
  iniciarSesionDePrueba(token)
  return renderizarApp(`/beneficiarios/${id}`)
}

function dato(nombre: string) {
  return screen.getByText(nombre, { selector: 'dt' }).nextElementSibling!
}

describe('ficha del comensal', () => {
  beforeEach(() => {
    localStorage.clear()
    reiniciarBeneficiariosMock()
    servidor.use(...handlers)
  })

  it('muestra los datos de la persona', async () => {
    abrirFicha(ID_MARIA)

    expect(await screen.findByRole('heading', { name: 'María Elena Restrepo' })).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'Ficha del comensal', level: 1 }),
    ).toBeInTheDocument()
    expect(dato('Nacimiento')).toHaveTextContent('15/03/1958')
    expect(dato('Barrio')).toHaveTextContent('El Poblado')
    expect(dato('En el padrón desde')).toHaveTextContent('08/11/2026')
  })

  it('el voluntario ve el documento enmascarado y no ve el teléfono', async () => {
    abrirFicha(ID_MARIA, VOLUNTARIO)
    await screen.findByRole('heading', { name: 'María Elena Restrepo' })

    expect(dato('Documento')).toHaveTextContent('CC ••••5390')
    expect(screen.queryByText('Teléfono')).not.toBeInTheDocument()
    expect(screen.queryByText(/42\.?185\.?390/)).not.toBeInTheDocument()
  })

  it('la coordinadora ve el documento completo y el teléfono', async () => {
    abrirFicha(ID_MARIA, COORDINADORA)
    await screen.findByRole('heading', { name: 'María Elena Restrepo' })

    expect(dato('Documento')).toHaveTextContent('CC 42.185.390')
    expect(dato('Teléfono')).toHaveTextContent('Sin registrar')
  })

  it('dice cuando la persona no tiene documento', async () => {
    abrirFicha(ID_CARLOS)
    await screen.findByRole('heading', { name: 'Carlos Julio Morales Restrepo' })

    expect(dato('Documento')).toHaveTextContent('Sin documento')
  })

  it('permite volver al padrón', async () => {
    const enrutador = abrirFicha(ID_MARIA)

    await userEvent.click(await screen.findByRole('link', { name: 'Volver al padrón' }))

    expect(await screen.findByRole('heading', { name: 'Beneficiarios' })).toBeInTheDocument()
    expect(enrutador.state.location.pathname).toBe('/beneficiarios')
  })

  it('se llega tocando la tarjeta de la persona en el padrón', async () => {
    iniciarSesionDePrueba(VOLUNTARIO)
    const enrutador = renderizarApp('/beneficiarios')
    const tarjeta = (await screen.findByRole('heading', { name: 'María Elena Restrepo' })).closest(
      'a',
    )!

    await userEvent.click(tarjeta)

    expect(await screen.findByRole('heading', { name: 'Ficha del comensal' })).toBeInTheDocument()
    expect(enrutador.state.location.pathname).toBe(`/beneficiarios/${ID_MARIA}`)
    expect(
      await screen.findByRole('heading', { name: 'María Elena Restrepo', level: 2 }),
    ).toBeInTheDocument()
  })

  it('si la persona no existe lo dice y deja volver', async () => {
    abrirFicha('00000000-0000-4000-8000-999999999999')

    expect(await screen.findByText('No encontramos a esta persona')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Volver al padrón' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Reintentar' })).not.toBeInTheDocument()
  })

  it('si el servidor falla lo explica y permite reintentar', async () => {
    servidor.use(
      http.get(
        `*/api/beneficiarios/${ID_MARIA}`,
        () => HttpResponse.json({ statusCode: 500, message: 'Error' }, { status: 500 }),
        { once: true },
      ),
    )
    abrirFicha(ID_MARIA)

    expect(await screen.findByRole('alert')).toHaveTextContent('No pudimos cargar la ficha')

    await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }))

    expect(await screen.findByRole('heading', { name: 'María Elena Restrepo' })).toBeInTheDocument()
  })
})
