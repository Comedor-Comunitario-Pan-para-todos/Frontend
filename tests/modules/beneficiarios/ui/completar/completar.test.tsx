import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { reiniciarBeneficiariosMock } from '@/mocks/beneficiarios.ts'
import { handlers } from '@/mocks/handlers.ts'
import { iniciarSesionDePrueba, renderizarApp } from '../../../../app/renderizarApp.tsx'
import { servidor } from '../../../../mocks/servidor.ts'

const COORDINADORA = 'mock-token.mock-1'
const VOLUNTARIO = 'mock-token.mock-3'
const ID_MARIA = '00000000-0000-4000-8000-000000000001'
const ID_CARLOS = '00000000-0000-4000-8000-000000000002'

function dato(nombre: string) {
  return screen.getByText(nombre, { selector: 'dt' }).nextElementSibling!
}

async function escribir(campo: string, texto: string) {
  await userEvent.type(screen.getByLabelText(campo), texto)
}

async function guardar() {
  await userEvent.click(screen.getByRole('button', { name: 'Guardar datos' }))
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

    await userEvent.click(await screen.findByRole('link', { name: 'Completar datos extendidos' }))
    await screen.findByRole('heading', { name: 'Completar datos' })
    await userEvent.click(screen.getByRole('radio', { name: 'Tarjeta de identidad' }))
    await escribir('Número de documento', '1086999888')
    await escribir('Teléfono', '3151234567')
    await userEvent.click(screen.getByRole('checkbox', { name: 'Informé a la persona' }))
    await guardar()

    expect(await screen.findByText('Datos completados')).toBeInTheDocument()
    expect(await screen.findByText('Registro extendido')).toBeInTheDocument()
    expect(dato('Documento')).toHaveTextContent('TI 1.086.999.888')
    expect(dato('Teléfono')).toHaveTextContent('3151234567')
    expect(enrutador.state.location.pathname).toBe(`/beneficiarios/${ID_CARLOS}`)
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
      screen.getByText('Confirme que informó a la persona antes de guardar sus datos.'),
    ).toBeInTheDocument()
  })

  it('avisa si el documento ya es de otra persona y conserva lo escrito', async () => {
    iniciarSesionDePrueba(VOLUNTARIO)
    renderizarApp(`/beneficiarios/${ID_CARLOS}/completar`)
    await screen.findByRole('button', { name: 'Guardar datos' })

    await escribir('Número de documento', '42185390')
    await userEvent.click(screen.getByRole('checkbox', { name: 'Informé a la persona' }))
    await guardar()

    expect(await screen.findByText('Ese documento ya es de otra persona')).toBeInTheDocument()
    expect(screen.getByLabelText('Número de documento')).toHaveValue('42185390')
  })

  it('no ofrece completar a quien ya está en nivel extendido', async () => {
    iniciarSesionDePrueba(VOLUNTARIO)
    renderizarApp(`/beneficiarios/${ID_MARIA}/completar`)

    expect(await screen.findByText('Esta persona ya tiene registro extendido')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Guardar datos' })).not.toBeInTheDocument()
  })
})
