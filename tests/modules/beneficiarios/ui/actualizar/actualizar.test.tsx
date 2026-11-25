import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import type { QueryClient } from '@tanstack/react-query'
import { beforeEach, describe, expect, it } from 'vitest'
import { crearQueryClient } from '@/app/queryClient.ts'
import { reiniciarBeneficiariosMock } from '@/mocks/beneficiarios.ts'
import { handlers } from '@/mocks/handlers.ts'
import { iniciarSesionDePrueba, renderizarApp } from '../../../../app/renderizarApp.tsx'
import { servidor } from '../../../../mocks/servidor.ts'

const COORDINADORA = 'mock-token.mock-1'
const VOLUNTARIO = 'mock-token.mock-3'
const ID_MARIA = '00000000-0000-4000-8000-000000000001'
const ID_ROSA = '00000000-0000-4000-8000-000000000003'
const ID_PEDRO = '00000000-0000-4000-8000-000000000008'
const ID_INEXISTENTE = '00000000-0000-4000-8000-000000009999'

function dato(nombre: string) {
  return screen.getByText(nombre, { selector: 'dt' }).nextElementSibling!
}

async function reemplazar(campo: string, texto: string) {
  const entrada = screen.getByLabelText(campo)
  await userEvent.clear(entrada)
  if (texto !== '') await userEvent.type(entrada, texto, { delay: null })
}

async function guardar() {
  await userEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }))
}

async function abrir(id: string, cliente?: QueryClient) {
  const enrutador = renderizarApp(`/beneficiarios/${id}/actualizar`, cliente)
  await screen.findByRole('button', { name: 'Guardar cambios' })
  return enrutador
}

describe('actualizar datos', () => {
  beforeEach(() => {
    localStorage.clear()
    reiniciarBeneficiariosMock()
    servidor.use(...handlers)
  })

  it('desde la ficha se abre con los datos que ya tiene la persona', async () => {
    iniciarSesionDePrueba(VOLUNTARIO)
    const enrutador = renderizarApp(`/beneficiarios/${ID_MARIA}`)

    await userEvent.click(await screen.findByRole('link', { name: 'Actualizar datos' }))

    expect(await screen.findByRole('heading', { name: 'Actualizar datos' })).toBeInTheDocument()
    expect(enrutador.state.location.pathname).toBe(`/beneficiarios/${ID_MARIA}/actualizar`)
    expect(screen.getByLabelText('Nombres')).toHaveValue('María Elena')
    expect(screen.getByLabelText('Apellidos')).toHaveValue('Restrepo')
    expect(screen.getByLabelText('Fecha de nacimiento')).toHaveValue('1958-03-15')
    expect(screen.getByLabelText('Barrio o sector')).toHaveValue('El Poblado')
  })

  it('guarda los cambios, confirma y vuelve a la ficha actualizada', async () => {
    iniciarSesionDePrueba(VOLUNTARIO)
    // El cliente de la app guarda la ficha 30 s: sin refrescarla se vería la vieja.
    const enrutador = await abrir(ID_PEDRO, crearQueryClient())

    await reemplazar('Apellidos', 'Zapata Ríos')
    await reemplazar('Barrio o sector', 'Cuba')
    await guardar()

    expect(await screen.findByText('Datos actualizados')).toBeInTheDocument()
    expect(
      await screen.findByRole('heading', { name: 'Pedro Pablo Zapata Ríos' }),
    ).toBeInTheDocument()
    expect(dato('Barrio')).toHaveTextContent('Cuba')
    expect(enrutador.state.location.pathname).toBe(`/beneficiarios/${ID_PEDRO}`)
  })

  it('al dejar el barrio vacío lo borra de la ficha', async () => {
    iniciarSesionDePrueba(VOLUNTARIO)
    await abrir(ID_MARIA)

    await reemplazar('Barrio o sector', '')
    await guardar()

    await screen.findByText('Datos actualizados')
    expect(await screen.findByText('Sin registrar')).toBeInTheDocument()
    expect(dato('Barrio')).toHaveTextContent('Sin registrar')
  })

  it('no toca los datos sensibles de quien está en nivel extendido', async () => {
    iniciarSesionDePrueba(COORDINADORA)
    await abrir(ID_MARIA)

    await reemplazar('Nombres', 'María')
    await guardar()

    await screen.findByRole('heading', { name: 'María Restrepo' })
    expect(dato('Documento')).toHaveTextContent('CC 42.185.390')
  })

  it('valida antes de enviar y no manda nada si falta un dato obligatorio', async () => {
    let enviados = 0
    servidor.use(
      http.patch('*/api/beneficiarios/:id', () => {
        enviados += 1
        return undefined
      }),
    )
    iniciarSesionDePrueba(VOLUNTARIO)
    await abrir(ID_PEDRO)

    await reemplazar('Nombres', '')
    await guardar()

    expect(await screen.findByText('Escriba los nombres.')).toBeInTheDocument()
    expect(enviados).toBe(0)
  })

  it('no acepta una fecha de nacimiento futura', async () => {
    iniciarSesionDePrueba(VOLUNTARIO)
    await abrir(ID_PEDRO)

    await reemplazar('Fecha de nacimiento', '2999-01-01')
    await guardar()

    expect(
      await screen.findByText('La fecha de nacimiento no puede ser futura.'),
    ).toBeInTheDocument()
  })

  it('avisa que es menor de edad si la fecha corregida lo es', async () => {
    iniciarSesionDePrueba(VOLUNTARIO)
    await abrir(ID_PEDRO)
    expect(screen.queryByText('Es menor de edad')).not.toBeInTheDocument()

    await reemplazar('Fecha de nacimiento', '2015-06-02')

    expect(await screen.findByText('Es menor de edad')).toBeInTheDocument()
  })

  it('si el servidor falla, lo dice y conserva lo escrito', async () => {
    servidor.use(
      http.patch('*/api/beneficiarios/:id', () =>
        HttpResponse.json({ statusCode: 500, message: 'Error' }, { status: 500 }),
      ),
    )
    iniciarSesionDePrueba(VOLUNTARIO)
    await abrir(ID_PEDRO)

    await reemplazar('Barrio o sector', 'Cuba')
    await guardar()

    expect(await screen.findByText('No se pudieron actualizar los datos')).toBeInTheDocument()
    expect(screen.getByLabelText('Barrio o sector')).toHaveValue('Cuba')
    expect(screen.queryByText('Datos actualizados')).not.toBeInTheDocument()
  })

  it('si la persona no existe, lo dice en vez de mostrar el formulario', async () => {
    iniciarSesionDePrueba(VOLUNTARIO)
    renderizarApp(`/beneficiarios/${ID_INEXISTENTE}/actualizar`)

    expect(await screen.findByText('No encontramos a esta persona')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Guardar cambios' })).not.toBeInTheDocument()
  })
})

describe('actualizar datos sensibles', () => {
  beforeEach(() => {
    localStorage.clear()
    reiniciarBeneficiariosMock()
    servidor.use(...handlers)
  })

  it('la coordinación los ve con lo que ya tiene la persona y los cambia', async () => {
    iniciarSesionDePrueba(COORDINADORA)
    await abrir(ID_ROSA)

    expect(screen.getByRole('heading', { name: 'Datos sensibles' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'Cédula de ciudadanía' })).toBeChecked()
    expect(screen.getByLabelText('Número de documento')).toHaveValue('24891034')
    expect(screen.getByLabelText('Teléfono')).toHaveValue('3104567812')
    expect(screen.getByLabelText('Grupo')).toHaveValue('A3')

    await reemplazar('Teléfono', '3209876543')
    await guardar()

    await screen.findByText('Datos actualizados')
    expect(await screen.findByText('3209876543')).toBeInTheDocument()
    expect(dato('Documento')).toHaveTextContent('CC 24.891.034')
  })

  it('al dejar el teléfono vacío lo borra', async () => {
    iniciarSesionDePrueba(COORDINADORA)
    await abrir(ID_ROSA)

    await reemplazar('Teléfono', '')
    await guardar()

    await screen.findByText('Datos actualizados')
    await screen.findByRole('heading', { name: 'Rosa Martínez de Osorio' })
    expect(dato('Teléfono')).toHaveTextContent('Sin registrar')
  })

  it('el voluntario no los ve', async () => {
    iniciarSesionDePrueba(VOLUNTARIO)
    await abrir(ID_ROSA)

    expect(screen.queryByRole('heading', { name: 'Datos sensibles' })).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Número de documento')).not.toBeInTheDocument()
  })

  it('en nivel básico no se muestran: eso es completar datos', async () => {
    iniciarSesionDePrueba(COORDINADORA)
    await abrir(ID_PEDRO)

    expect(screen.queryByRole('heading', { name: 'Datos sensibles' })).not.toBeInTheDocument()
  })

  it('valida los datos sensibles antes de enviar', async () => {
    iniciarSesionDePrueba(COORDINADORA)
    await abrir(ID_ROSA)

    await reemplazar('Teléfono', '12345')
    await guardar()

    expect(
      await screen.findByText('Revise el teléfono: 7 dígitos si es fijo o 10 si es celular.'),
    ).toBeInTheDocument()
  })

  it('avisa mientras se escribe si el documento ya es de otra persona', async () => {
    iniciarSesionDePrueba(COORDINADORA)
    await abrir(ID_ROSA)

    await reemplazar('Número de documento', '42185390')

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

  it('no avisa cuando el documento escrito es el de la misma persona', async () => {
    iniciarSesionDePrueba(COORDINADORA)
    await abrir(ID_ROSA)

    await reemplazar('Teléfono', '3209876543')
    await new Promise((resolver) => setTimeout(resolver, 700))

    expect(screen.queryByText('Ese documento ya es de otra persona')).not.toBeInTheDocument()
  })

  it('si el servidor responde que el documento es de otra persona, lo dice y conserva lo escrito', async () => {
    servidor.use(
      http.get('*/beneficiarios/validar-documento/:numero', () =>
        HttpResponse.json({ existe: false, beneficiario: null }),
      ),
    )
    iniciarSesionDePrueba(COORDINADORA)
    await abrir(ID_ROSA)

    await reemplazar('Número de documento', '42185390')
    await guardar()

    const sensibles = screen.getByRole('region', { name: 'Datos sensibles' })
    expect(
      await within(sensibles).findByText('Ese documento ya es de otra persona'),
    ).toBeInTheDocument()
    expect(screen.getByLabelText('Número de documento')).toHaveValue('42185390')
    expect(screen.getByLabelText('Número de documento')).toHaveFocus()
    expect(screen.queryByText('No se pudieron actualizar los datos')).not.toBeInTheDocument()
  })
})
