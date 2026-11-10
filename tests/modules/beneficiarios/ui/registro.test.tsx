import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { beforeEach, describe, expect, it } from 'vitest'
import { reiniciarBeneficiariosMock } from '@/mocks/beneficiarios.ts'
import { handlers } from '@/mocks/handlers.ts'
import { iniciarSesionDePrueba, renderizarApp } from '../../../app/renderizarApp.tsx'
import { servidor } from '../../../mocks/servidor.ts'

const VOLUNTARIO = 'mock-token.mock-3'

async function abrirRegistro() {
  iniciarSesionDePrueba(VOLUNTARIO)
  const enrutador = renderizarApp('/beneficiarios/nuevo')
  await screen.findByRole('heading', { name: 'Registrar persona' })
  return enrutador
}

async function escribir(campo: string, texto: string) {
  await userEvent.type(screen.getByLabelText(campo), texto)
}

async function llenarIdentidad(nombres = 'Persona', apellidos = 'De Prueba', fecha = '1990-01-31') {
  await escribir('Nombres', nombres)
  await escribir('Apellidos', apellidos)
  await escribir('Fecha de nacimiento', fecha)
}

async function marcar(casilla: string) {
  await userEvent.click(screen.getByRole('checkbox', { name: casilla }))
}

async function registrar() {
  await userEvent.click(screen.getByRole('button', { name: 'Registrar persona' }))
}

describe('registro de beneficiarios', () => {
  beforeEach(() => {
    localStorage.clear()
    reiniciarBeneficiariosMock()
    servidor.use(...handlers)
  })

  it('se llega desde el padrón', async () => {
    iniciarSesionDePrueba(VOLUNTARIO)
    renderizarApp('/beneficiarios')

    await userEvent.click(
      await screen.findByRole('link', { name: '¿No está en el padrón? Registrar persona' }),
    )

    expect(await screen.findByRole('heading', { name: 'Registrar persona' })).toBeInTheDocument()
  })

  it('registra a la persona, lo confirma y abre su ficha', async () => {
    const enrutador = await abrirRegistro()
    await llenarIdentidad()
    await escribir('Número de documento', '99.000.111')
    await escribir('Barrio o sector', 'El Jardín')
    await marcar('Informé a la persona')

    await registrar()

    expect(await screen.findByText('Persona registrada')).toBeInTheDocument()
    expect(await screen.findByRole('heading', { name: 'Ficha del comensal' })).toBeInTheDocument()
    expect(
      await screen.findByRole('heading', { name: 'Persona De Prueba', level: 2 }),
    ).toBeInTheDocument()
    expect(screen.getByText('CC ••••0111')).toBeInTheDocument()
    expect(enrutador.state.location.pathname).toMatch(/^\/beneficiarios\/[0-9a-f-]{36}$/)
  })

  it('registra a una persona sin documento', async () => {
    await abrirRegistro()
    await llenarIdentidad()
    await marcar('Sin documento')
    await marcar('Informé a la persona')

    expect(screen.queryByLabelText('Número de documento')).not.toBeInTheDocument()

    await registrar()

    expect(await screen.findByRole('heading', { name: 'Ficha del comensal' })).toBeInTheDocument()
    expect(await screen.findByText('Sin documento')).toBeInTheDocument()
  })

  it('avisa lo que falta antes de enviar y no llama al servidor', async () => {
    let llamadas = 0
    servidor.use(
      http.post('*/api/beneficiarios', () => {
        llamadas += 1
        return undefined
      }),
    )
    await abrirRegistro()

    await registrar()

    expect(await screen.findByText('Escriba los nombres.')).toBeInTheDocument()
    expect(screen.getByText('Escriba los apellidos.')).toBeInTheDocument()
    expect(screen.getByText('Escriba el número o marque «Sin documento».')).toBeInTheDocument()
    expect(screen.getByText('Indique la fecha de nacimiento.')).toBeInTheDocument()
    expect(
      screen.getByText('Confirme que informó a la persona antes de registrarla.'),
    ).toBeInTheDocument()
    expect(llamadas).toBe(0)
  })

  it('no acepta una fecha de nacimiento futura', async () => {
    await abrirRegistro()
    await llenarIdentidad('Persona', 'De Prueba', '2999-01-01')

    await registrar()

    expect(
      await screen.findByText('La fecha de nacimiento no puede ser futura.'),
    ).toBeInTheDocument()
  })

  it('el barrio es opcional y la autorización empieza desmarcada', async () => {
    await abrirRegistro()

    expect(screen.getByLabelText('Barrio o sector')).toHaveAccessibleDescription(
      'Opcional No condiciona la entrega del almuerzo.',
    )
    expect(screen.getByRole('checkbox', { name: 'Informé a la persona' })).not.toBeChecked()
    expect(screen.getByText('Registra: Voluntario de Prueba')).toBeInTheDocument()
  })

  it('avisa mientras se escribe si el documento ya está en el padrón', async () => {
    await abrirRegistro()

    await escribir('Número de documento', '42.185.390')

    expect(
      await screen.findByText('Ya hay una persona con este documento', {}, { timeout: 3000 }),
    ).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'María Elena Restrepo' })).toBeInTheDocument()
  })

  it('avisa si coincide el nombre y la fecha de nacimiento de alguien sin documento', async () => {
    await abrirRegistro()
    await marcar('Sin documento')

    await llenarIdentidad('carlos julio', 'morales restrepo', '2014-03-15')

    expect(
      await screen.findByText(
        'Ya hay una persona con este nombre y fecha de nacimiento',
        {},
        { timeout: 3000 },
      ),
    ).toBeInTheDocument()
  })

  it('si el servidor responde que ya existe, lo dice y conserva lo escrito', async () => {
    const enrutador = await abrirRegistro()
    await llenarIdentidad('María Elena', 'Restrepo', '1958-03-15')
    await escribir('Número de documento', '42185390')
    await marcar('Informé a la persona')

    await registrar()

    expect(await screen.findByText('Esta persona ya está en el padrón')).toBeInTheDocument()
    expect(screen.getByLabelText('Nombres')).toHaveValue('María Elena')
    expect(enrutador.state.location.pathname).toBe('/beneficiarios/nuevo')
  })

  it('si el servidor falla lo explica, conserva lo escrito y deja reintentar', async () => {
    servidor.use(
      http.post(
        '*/api/beneficiarios',
        () => HttpResponse.json({ statusCode: 500, message: 'Error' }, { status: 500 }),
        { once: true },
      ),
    )
    await abrirRegistro()
    await llenarIdentidad()
    await marcar('Sin documento')
    await marcar('Informé a la persona')

    await registrar()

    expect(await screen.findByText('No se pudo registrar')).toBeInTheDocument()
    expect(screen.getByLabelText('Apellidos')).toHaveValue('De Prueba')

    await registrar()

    expect(await screen.findByRole('heading', { name: 'Ficha del comensal' })).toBeInTheDocument()
  })

  it('cancelar vuelve al padrón sin registrar', async () => {
    const enrutador = await abrirRegistro()

    await userEvent.click(screen.getByRole('link', { name: 'Cancelar' }))

    await waitFor(() => expect(enrutador.state.location.pathname).toBe('/beneficiarios'))
    expect(await screen.findByText('24 personas en el padrón')).toBeInTheDocument()
  })
})
