import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { beforeEach, describe, expect, it } from 'vitest'
import { reiniciarBeneficiariosMock } from '@/mocks/beneficiarios.ts'
import { handlers } from '@/mocks/handlers.ts'
import { iniciarSesionDePrueba, renderizarApp } from '../../../../app/renderizarApp.tsx'
import { servidor } from '../../../../mocks/servidor.ts'

const COORDINADORA = 'mock-token.mock-1'
const VOLUNTARIO = 'mock-token.mock-3'
const ID_MARIA = '00000000-0000-4000-8000-000000000001'
const ID_CARLOS = '00000000-0000-4000-8000-000000000002'
const PAPEL_FIRMADO = new File(['%PDF-1.4 firma'], 'autorizacion.pdf', { type: 'application/pdf' })

function abrirTutor(id = ID_CARLOS, token = COORDINADORA) {
  iniciarSesionDePrueba(token)
  return renderizarApp(`/beneficiarios/${id}/tutor`)
}

async function escribir(campo: string, texto: string) {
  await userEvent.type(screen.getByLabelText(campo), texto, { delay: null })
}

async function aprobar() {
  await userEvent.click(screen.getByRole('button', { name: 'Aprobar al tutor' }))
}

async function llenarFormulario() {
  await escribir('Nombre del tutor', 'Luz Marina Díaz')
  await userEvent.click(screen.getByRole('radio', { name: 'Madre' }))
  await escribir('Número de documento', '52123456')
  await escribir('Teléfono del tutor', '3101234567')
  await userEvent.upload(screen.getByLabelText('Elegir archivo'), PAPEL_FIRMADO)
  await userEvent.click(screen.getByRole('checkbox', { name: 'Revisé el papel firmado' }))
}

describe('aprobar al tutor de un menor', () => {
  beforeEach(() => {
    localStorage.clear()
    reiniciarBeneficiariosMock()
    servidor.use(...handlers)
  })

  it('la Coordinadora lo aprueba con el papel firmado y vuelve a la ficha', async () => {
    const enrutador = abrirTutor()
    await screen.findByText('Del menor Carlos Julio Morales Restrepo')

    await llenarFormulario()
    expect(screen.getByText('autorizacion.pdf')).toBeInTheDocument()
    await aprobar()

    expect(await screen.findByText('Tutor aprobado')).toBeInTheDocument()
    expect(enrutador.state.location.pathname).toBe(`/beneficiarios/${ID_CARLOS}`)
  })

  it('con un tutor ya aprobado no deja aprobar otro', async () => {
    const enrutador = abrirTutor()
    await screen.findByRole('button', { name: 'Aprobar al tutor' })
    await llenarFormulario()
    await aprobar()
    await screen.findByText('Tutor aprobado')

    await enrutador.navigate(`/beneficiarios/${ID_CARLOS}/tutor`)

    expect(await screen.findByText('Este menor ya tiene un tutor aprobado')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Aprobar al tutor' })).not.toBeInTheDocument()
  })

  it('avisa que no es requisito para recibir la ración', async () => {
    abrirTutor()
    expect(await screen.findByText(/No es requisito para recibir la ración/)).toBeInTheDocument()
  })

  it('pide los datos del tutor, el papel y la casilla de revisión', async () => {
    abrirTutor()
    await screen.findByRole('button', { name: 'Aprobar al tutor' })

    await aprobar()

    expect(
      await screen.findByText('Escriba el nombre del tutor como aparece en el papel.'),
    ).toBeInTheDocument()
    expect(screen.getByText('Elija qué es del menor.')).toBeInTheDocument()
    expect(screen.getByText('Escriba el número de documento del tutor.')).toBeInTheDocument()
    expect(screen.getByText('Escriba el teléfono del tutor.')).toBeInTheDocument()
    expect(
      screen.getByText('Tómele una foto al papel firmado o elija el archivo.'),
    ).toBeInTheDocument()
    expect(
      screen.getByText('Marque la casilla después de revisar el papel firmado.'),
    ).toBeInTheDocument()
  })

  it('el pasaporte admite letras y la cédula no', async () => {
    abrirTutor()
    await screen.findByRole('button', { name: 'Aprobar al tutor' })
    await escribir('Número de documento', 'AB123456')
    await userEvent.tab()

    expect(await screen.findByText(/cédula de ciudadanía lleva/)).toBeInTheDocument()

    await userEvent.click(screen.getByRole('radio', { name: 'Pasaporte' }))

    expect(screen.queryByText(/lleva de/)).not.toBeInTheDocument()
  })

  it('con pasaporte el celular muestra el teclado de letras, con cédula el de números', async () => {
    abrirTutor()
    const numero = await screen.findByLabelText('Número de documento')
    expect(numero).toHaveAttribute('inputmode', 'numeric')

    await userEvent.click(screen.getByRole('radio', { name: 'Pasaporte' }))

    expect(numero).toHaveAttribute('inputmode', 'text')
  })

  it('si el servidor falla, avisa y conserva lo escrito', async () => {
    servidor.use(
      http.post(
        '*/api/beneficiarios/:id/autorizacion-tutor',
        () => HttpResponse.json({ statusCode: 500, message: 'Error' }, { status: 500 }),
        { once: true },
      ),
    )
    abrirTutor()
    await screen.findByRole('button', { name: 'Aprobar al tutor' })
    await llenarFormulario()

    await aprobar()

    expect(await screen.findByText('No se pudo aprobar al tutor')).toBeInTheDocument()
    expect(screen.getByLabelText('Nombre del tutor')).toHaveValue('Luz Marina Díaz')
    expect(screen.getByText('autorizacion.pdf')).toBeInTheDocument()
  })

  it('a un adulto no se le aprueba tutor', async () => {
    abrirTutor(ID_MARIA)
    expect(await screen.findByText('Esta persona ya es mayor de edad')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Aprobar al tutor' })).not.toBeInTheDocument()
  })

  it('el Voluntario no puede entrar', async () => {
    abrirTutor(ID_CARLOS, VOLUNTARIO)
    expect(
      await screen.findByText('Esta sección no está habilitada para su perfil'),
    ).toBeInTheDocument()
  })
})
