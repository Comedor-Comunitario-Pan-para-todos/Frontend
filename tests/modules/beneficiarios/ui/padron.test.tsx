import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { beforeEach, describe, expect, it } from 'vitest'
import { reiniciarBeneficiariosMock } from '@/mocks/beneficiarios.ts'
import { handlers } from '@/mocks/handlers.ts'
import { iniciarSesionDePrueba, renderizarApp } from '../../../app/renderizarApp.tsx'
import { servidor } from '../../../mocks/servidor.ts'

const COORDINADORA = 'mock-token.mock-1'
const VOLUNTARIO = 'mock-token.mock-3'

function caidaDelServidor() {
  return HttpResponse.json({ statusCode: 500, message: 'Internal server error' }, { status: 500 })
}

async function abrirPadron(token = VOLUNTARIO) {
  iniciarSesionDePrueba(token)
  renderizarApp('/beneficiarios')
  await screen.findByText('24 personas en el padrón')
}

async function buscar(texto: string) {
  await userEvent.type(screen.getByRole('searchbox', { name: 'Buscar persona' }), texto)
}

function estadoDelPadron() {
  return within(screen.getByRole('region', { name: 'Personas del padrón' })).getByRole('status')
}

function tarjetas() {
  return screen.queryAllByRole('article')
}

function tarjetaDe(nombre: string) {
  return screen.getByRole('heading', { name: nombre }).closest('article')!
}

describe('padrón de beneficiarios', () => {
  beforeEach(() => {
    localStorage.clear()
    reiniciarBeneficiariosMock()
    servidor.use(...handlers)
  })

  describe('listado', () => {
    it('muestra a las personas más recientes y cuántas hay en el padrón', async () => {
      await abrirPadron()

      expect(screen.getByRole('heading', { name: 'Beneficiarios', level: 1 })).toBeInTheDocument()
      expect(tarjetas()).toHaveLength(20)
      expect(tarjetas()[0]).toHaveTextContent('María Elena Restrepo')
      expect(screen.getByText('Mostrando 20 de 24')).toBeInTheDocument()
    })

    it('"Ver más personas" trae el resto y luego desaparece', async () => {
      await abrirPadron()

      await userEvent.click(screen.getByRole('button', { name: 'Ver más personas' }))

      await waitFor(() => expect(tarjetas()).toHaveLength(24))
      expect(screen.queryByRole('button', { name: 'Ver más personas' })).not.toBeInTheDocument()
      expect(estadoDelPadron()).toHaveTextContent('24 personas en el padrón')
    })

    it('si falla "Ver más" conserva la lista, avisa y deja reintentar', async () => {
      await abrirPadron()
      servidor.use(
        http.get(
          '*/api/beneficiarios',
          ({ request }) =>
            new URL(request.url).searchParams.get('page') === '2' ? caidaDelServidor() : undefined,
          { once: true },
        ),
      )

      await userEvent.click(screen.getByRole('button', { name: 'Ver más personas' }))

      expect(await screen.findByRole('alert')).toHaveTextContent(
        'Ocurrió un problema en el servidor',
      )
      expect(tarjetas()).toHaveLength(20)

      await userEvent.click(screen.getByRole('button', { name: 'Ver más personas' }))

      await waitFor(() => expect(tarjetas()).toHaveLength(24))
      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    })
  })

  describe('búsqueda', () => {
    it('busca mientras se escribe, sin oprimir ningún botón', async () => {
      await abrirPadron()

      await buscar('bedoya lópez')

      expect(await screen.findByText('2 resultados')).toBeInTheDocument()
      expect(tarjetas().map((tarjeta) => within(tarjeta).getByRole('heading').textContent)).toEqual(
        ['Yeison Andrés Bedoya López', 'Ana Sofía Bedoya López'],
      )
    })

    it('avisa de inmediato que está buscando', async () => {
      await abrirPadron()

      await buscar('b')

      expect(estadoDelPadron()).toHaveTextContent('Buscando…')
    })

    it('encuentra por el documento aunque se escriba con puntos', async () => {
      await abrirPadron()

      await buscar('42.185.390')

      expect(await screen.findByText('1 resultado')).toBeInTheDocument()
      expect(screen.getByRole('heading', { name: 'María Elena Restrepo' })).toBeInTheDocument()
    })

    it('borrar la búsqueda devuelve el padrón completo y deja el foco en el buscador', async () => {
      await abrirPadron()
      await buscar('bedoya lópez')
      await screen.findByText('2 resultados')

      await userEvent.click(screen.getByRole('button', { name: 'Borrar la búsqueda' }))

      const buscador = screen.getByRole('searchbox', { name: 'Buscar persona' })
      expect(buscador).toHaveValue('')
      expect(buscador).toHaveFocus()
      expect(await screen.findByText('24 personas en el padrón')).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'Borrar la búsqueda' })).not.toBeInTheDocument()
    })

    it('sin coincidencias lo dice y orienta sobre cómo buscar', async () => {
      await abrirPadron()

      await buscar('zzz')

      expect(await screen.findByText('No encontramos a nadie con «zzz».')).toBeInTheDocument()
      expect(tarjetas()).toHaveLength(0)
      expect(
        screen.getByText('Revise cómo está escrito o pruebe con el número de documento.'),
      ).toBeInTheDocument()
    })

    it('con nombre y apellido juntos ofrece buscar cada palabra por separado', async () => {
      await abrirPadron()
      await buscar('maria restrepo')
      await screen.findByText('No encontramos a nadie con «maria restrepo».')

      await userEvent.click(screen.getByRole('button', { name: 'Buscar «restrepo»' }))

      expect(screen.getByRole('searchbox', { name: 'Buscar persona' })).toHaveValue('restrepo')
      expect(await screen.findByText('2 resultados')).toBeInTheDocument()
      expect(screen.getByRole('heading', { name: 'María Elena Restrepo' })).toBeInTheDocument()
    })
  })

  describe('fallas', () => {
    it('si el padrón no carga lo explica y permite reintentar', async () => {
      servidor.use(http.get('*/api/beneficiarios', caidaDelServidor, { once: true }))
      iniciarSesionDePrueba(VOLUNTARIO)
      renderizarApp('/beneficiarios')

      const alerta = await screen.findByRole('alert')
      expect(alerta).toHaveTextContent('No pudimos cargar el padrón')
      expect(alerta).toHaveTextContent('Ocurrió un problema en el servidor')

      await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }))

      expect(await screen.findByText('24 personas en el padrón')).toBeInTheDocument()
      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    })
  })

  describe('datos sensibles (RNF-07)', () => {
    it('el voluntario solo ve los últimos dígitos del documento', async () => {
      await abrirPadron(VOLUNTARIO)

      const maria = within(tarjetaDe('María Elena Restrepo'))
      expect(maria.getByText('CC ••••5390')).toBeInTheDocument()
      expect(maria.getByText('CC, número oculto que termina en 5390')).toBeInTheDocument()
      expect(screen.queryByText(/42\.?185\.?390/)).not.toBeInTheDocument()
    })

    it('la coordinadora ve el documento completo', async () => {
      await abrirPadron(COORDINADORA)

      expect(
        within(tarjetaDe('María Elena Restrepo')).getByText('CC 42.185.390'),
      ).toBeInTheDocument()
    })

    it('una persona sin documento aparece como tal, con su barrio', async () => {
      await abrirPadron()

      const carlos = within(tarjetaDe('Carlos Julio Morales Restrepo'))
      expect(carlos.getByText('Sin documento')).toBeInTheDocument()
      expect(carlos.getByText('Villasantana')).toBeInTheDocument()
    })
  })
})
