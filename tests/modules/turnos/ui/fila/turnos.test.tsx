import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { beforeEach, describe, expect, it } from 'vitest'
import { reiniciarBeneficiariosMock } from '@/mocks/beneficiarios.ts'
import { handlers } from '@/mocks/handlers.ts'
import { reiniciarTurnosMock } from '@/mocks/turnos.ts'
import { iniciarSesionDePrueba, renderizarApp } from '../../../../app/renderizarApp.tsx'
import { servidor } from '../../../../mocks/servidor.ts'
import { turnoDe } from '../../datosDePrueba.ts'

const VOLUNTARIO = 'mock-token.mock-3'
const ID_MARIA_ELENA = '00000000-0000-4000-8000-000000000001'

function abrirTurnos() {
  iniciarSesionDePrueba(VOLUNTARIO)
  return renderizarApp('/turnos')
}

function listaDeHoy() {
  return screen.getByRole('region', { name: 'Turnos entregados hoy' })
}

async function elegirPersona(
  usuario: ReturnType<typeof userEvent.setup>,
  buscar: string,
  nombre: RegExp,
) {
  await usuario.type(await screen.findByRole('searchbox', { name: 'Buscar persona' }), buscar)
  await usuario.click(await screen.findByRole('button', { name: nombre }))
}

describe('turnos de la fila', () => {
  beforeEach(() => {
    localStorage.clear()
    reiniciarBeneficiariosMock()
    reiniciarTurnosMock()
    servidor.use(...handlers)
  })

  it('muestra los turnos de hoy con el último entregado de primero', async () => {
    abrirTurnos()

    expect(await screen.findByRole('heading', { name: 'Turnos de hoy', level: 1 })).toBeVisible()
    expect(await within(listaDeHoy()).findByText('3 en total')).toBeVisible()
    const filas = within(listaDeHoy()).getAllByRole('listitem')
    expect(filas.map((fila) => within(fila).getByText(/^#\d+$/).textContent)).toEqual([
      '#003',
      '#002',
      '#001',
    ])
    expect(within(filas[0]!).getByText('Luz Dary Cardona Marín')).toBeVisible()
  })

  it('entrega el turno a la persona elegida y lo muestra en grande', async () => {
    const usuario = userEvent.setup()
    abrirTurnos()

    await elegirPersona(usuario, 'Restrepo', /María Elena Restrepo/)
    expect(screen.getByText('Sin turno hoy')).toBeVisible()
    await usuario.click(screen.getByRole('button', { name: 'Entregar turno' }))

    const tiquete = await screen.findByRole('article', { name: 'Turno de hoy: #004' })
    expect(within(tiquete).getByText('María Elena Restrepo')).toBeVisible()
    expect(within(tiquete).getByText('En espera')).toBeVisible()
    expect(screen.getByText('Turno #004 entregado')).toBeVisible()
    expect(await within(listaDeHoy()).findByText('4 en total')).toBeVisible()
  })

  it('no entrega un segundo turno: muestra el que la persona ya tenía', async () => {
    const usuario = userEvent.setup()
    abrirTurnos()

    await usuario.type(await screen.findByRole('searchbox', { name: 'Buscar persona' }), 'Aníbal')
    const opcion = await screen.findByRole('button', { name: /José Aníbal Ospina Giraldo/ })
    expect(within(opcion).getByText('Ya tiene el turno #002')).toBeVisible()
    await usuario.click(opcion)

    expect(screen.getByRole('alert')).toHaveTextContent(
      'José Aníbal Ospina Giraldo ya tiene turno hoy',
    )
    expect(screen.getByRole('article', { name: 'Turno ya entregado hoy: #002' })).toBeVisible()
    expect(screen.queryByRole('button', { name: 'Entregar turno' })).not.toBeInTheDocument()
  })

  it('si otro voluntario ya le dio turno, el servidor lo frena y se muestra ese turno', async () => {
    const usuario = userEvent.setup()
    let turnosDelServidor: unknown[] = []
    servidor.use(
      http.get('*/api/turnos', () => HttpResponse.json(turnosDelServidor)),
      http.post('*/api/turnos', () =>
        HttpResponse.json({ statusCode: 409, message: 'Ya tiene turno' }, { status: 409 }),
      ),
    )
    abrirTurnos()

    await elegirPersona(usuario, 'Restrepo', /María Elena Restrepo/)
    turnosDelServidor = [turnoDe(7, ID_MARIA_ELENA, 'María Elena Restrepo')]
    await usuario.click(screen.getByRole('button', { name: 'Entregar turno' }))

    expect(
      await screen.findByRole('article', { name: 'Turno ya entregado hoy: #007' }),
    ).toBeVisible()
    expect(screen.getByRole('alert')).toHaveTextContent('María Elena Restrepo ya tiene turno hoy')
  })

  it('avisa que no se pueden entregar turnos si la jornada no está disponible', async () => {
    const usuario = userEvent.setup()
    abrirTurnos()

    await elegirPersona(usuario, 'Zapata', /Pedro Pablo Zapata/)
    await usuario.click(screen.getByRole('button', { name: 'Entregar turno' }))

    expect(await screen.findByText('No se pueden entregar turnos ahora')).toBeVisible()
    expect(screen.queryByRole('button', { name: 'Entregar turno' })).not.toBeInTheDocument()
  })

  it('si la entrega falla, avisa con la Constancia y permite reintentar', async () => {
    const usuario = userEvent.setup()
    abrirTurnos()

    await elegirPersona(usuario, 'Gloria', /Gloria Inés Henao Ríos/)
    await usuario.click(screen.getByRole('button', { name: 'Entregar turno' }))

    expect(await screen.findByText('No se entregó el turno')).toBeVisible()
    expect(
      screen.getByText(
        'Gloria Inés Henao Ríos sigue sin turno. Revise su conexión e inténtelo de nuevo.',
      ),
    ).toBeVisible()
    await usuario.click(screen.getByRole('button', { name: 'Reintentar' }))

    expect(await screen.findByRole('article', { name: 'Turno de hoy: #004' })).toBeVisible()
  })

  it('«Buscar a otra persona» limpia la búsqueda y deja el cursor en el buscador', async () => {
    const usuario = userEvent.setup()
    abrirTurnos()

    await elegirPersona(usuario, 'Aníbal', /José Aníbal Ospina Giraldo/)
    await usuario.click(screen.getByRole('button', { name: 'Buscar a otra persona' }))

    const buscador = screen.getByRole('searchbox', { name: 'Buscar persona' })
    expect(buscador).toHaveValue('')
    expect(buscador).toHaveFocus()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('cuando aún no hay turnos, dice cuál será el primero', async () => {
    servidor.use(http.get('*/api/turnos', () => HttpResponse.json([])))
    abrirTurnos()

    expect(await screen.findByText('Todavía no se ha entregado ningún turno hoy.')).toBeVisible()
    expect(screen.getByText('El primero que entregue será el #001.')).toBeVisible()
  })

  it('si la lista no carga, muestra el error y la vuelve a pedir', async () => {
    const usuario = userEvent.setup()
    servidor.use(
      http.get('*/api/turnos', () => HttpResponse.json({ message: 'caído' }, { status: 500 }), {
        once: true,
      }),
    )
    abrirTurnos()

    expect(await screen.findByText('No pudimos cargar los turnos de hoy')).toBeVisible()
    await usuario.click(screen.getByRole('button', { name: 'Reintentar' }))

    expect(await within(listaDeHoy()).findByText('3 en total')).toBeVisible()
  })
})
