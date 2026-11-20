import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { beforeEach, describe, expect, it } from 'vitest'
import { reiniciarBeneficiariosMock } from '@/mocks/beneficiarios.ts'
import { handlers } from '@/mocks/handlers.ts'
import {
  FINALIDAD_USO_IMAGEN,
  POLITICA_IMAGEN,
} from '@/modules/beneficiarios/domain/politicaImagen.ts'
import { ConsentimientoHttpRepository } from '@/modules/beneficiarios/infrastructure/http/ConsentimientoHttpRepository.ts'
import { iniciarSesionDePrueba, renderizarApp } from '../../../../app/renderizarApp.tsx'
import { crearHttp } from '../../../../mocks/clienteDePrueba.ts'
import { servidor } from '../../../../mocks/servidor.ts'

const COORDINADORA = 'mock-token.mock-1'
const VOLUNTARIO = 'mock-token.mock-3'
const ID_MARIA = '00000000-0000-4000-8000-000000000001'
const ID_CARLOS = '00000000-0000-4000-8000-000000000002'
const AUTORIZAR_FOTOS = 'Le expliqué y autorizó las fotos'
const ID_ROSA = '00000000-0000-4000-8000-000000000003'

function abrirFicha(id: string, token = VOLUNTARIO) {
  iniciarSesionDePrueba(token)
  return renderizarApp(`/beneficiarios/${id}`)
}

function consentimientos() {
  return new ConsentimientoHttpRepository(crearHttp(VOLUNTARIO))
}

function autorizarFotos(id: string) {
  return consentimientos().registrar(id, POLITICA_IMAGEN)
}

function historialDeFotos(id: string) {
  return consentimientos().consultarHistorial(id, FINALIDAD_USO_IMAGEN)
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

  it('el voluntario ve el documento enmascarado y no ve los demás datos sensibles', async () => {
    abrirFicha(ID_ROSA, VOLUNTARIO)
    await screen.findByRole('heading', { name: 'Rosa Martínez de Osorio' })

    expect(screen.getByText('Registro extendido')).toBeInTheDocument()
    expect(dato('Documento')).toHaveTextContent('CC ••••1034')
    expect(dato('Teléfono')).toHaveTextContent('Solo lo ve la coordinación')
    expect(dato('Clasificación socioeconómica')).toHaveTextContent('Solo lo ve la coordinación')
    expect(screen.queryByText(/3104567812|A3/)).not.toBeInTheDocument()
  })

  it('la coordinadora ve todos los datos sensibles', async () => {
    abrirFicha(ID_ROSA, COORDINADORA)
    await screen.findByRole('heading', { name: 'Rosa Martínez de Osorio' })

    expect(dato('Documento')).toHaveTextContent('CC 24.891.034')
    expect(dato('Teléfono')).toHaveTextContent('3104567812')
    expect(dato('Clasificación socioeconómica')).toHaveTextContent(
      'Registro Universal de Ingresos (RUI)A3 · Pobreza extrema',
    )
  })

  it('en nivel básico no muestra campos sensibles vacíos', async () => {
    abrirFicha(ID_CARLOS, COORDINADORA)
    await screen.findByRole('heading', { name: 'Carlos Julio Morales Restrepo' })

    expect(screen.getByText('Registro básico')).toBeInTheDocument()
    expect(dato('Datos sensibles')).toHaveTextContent('No se registraron')
    expect(screen.queryByText('Documento', { selector: 'dt' })).not.toBeInTheDocument()
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

  it('muestra cuándo, quién y sobre qué política se tomó la autorización', async () => {
    abrirFicha(ID_MARIA)

    const autorizacion = await screen.findByRole('region', { name: 'Autorización de datos' })

    expect(within(autorizacion).getByText('Autorizó el uso de sus datos')).toBeInTheDocument()
    expect(within(autorizacion).getByText('Coordinación de Prueba')).toBeInTheDocument()
    expect(within(autorizacion).getByText('Versión 1')).toBeInTheDocument()
    expect(within(autorizacion).getByText(/08\/11\/2026/)).toBeInTheDocument()
  })

  it('si falta la autorización, deja registrarla desde la ficha', async () => {
    abrirFicha(ID_CARLOS)
    const autorizacion = await screen.findByRole('region', { name: 'Autorización de datos' })
    expect(within(autorizacion).getByText('Autorización pendiente')).toBeInTheDocument()

    await userEvent.click(
      within(autorizacion).getByRole('button', { name: 'Le expliqué y aceptó' }),
    )

    expect(await screen.findByText('Autorización guardada')).toBeInTheDocument()
    expect(await within(autorizacion).findByText('Voluntario de Prueba')).toBeInTheDocument()
    expect(within(autorizacion).queryByText('Autorización pendiente')).not.toBeInTheDocument()
  })

  describe('uso de imagen', () => {
    it('sin autorización, avisa que no se le pueden tomar fotos', async () => {
      abrirFicha(ID_ROSA)

      const imagen = await screen.findByRole('region', { name: 'Uso de imagen' })

      expect(within(imagen).getByText('Rostro no fotografiable')).toBeInTheDocument()
      expect(within(imagen).queryByText('Tomada por')).not.toBeInTheDocument()
    })

    it('a un menor le indica que falta la autorización del tutor', async () => {
      abrirFicha(ID_CARLOS)

      const imagen = await screen.findByRole('region', { name: 'Uso de imagen' })

      expect(within(imagen).getByText('Requiere autorización del tutor')).toBeInTheDocument()
      expect(within(imagen).getByText(/es menor de edad/i)).toBeInTheDocument()
    })

    it('con autorización, muestra cuándo, quién y sobre qué política se tomó', async () => {
      await autorizarFotos(ID_ROSA)
      abrirFicha(ID_ROSA)

      const imagen = await screen.findByRole('region', { name: 'Uso de imagen' })

      expect(within(imagen).getByText('Foto autorizada')).toBeInTheDocument()
      expect(within(imagen).getByText('Voluntario de Prueba')).toBeInTheDocument()
      expect(within(imagen).getByText('Versión 1')).toBeInTheDocument()
    })

    it('no confunde la autorización de datos con la de imagen', async () => {
      abrirFicha(ID_MARIA)

      const imagen = await screen.findByRole('region', { name: 'Uso de imagen' })

      expect(within(imagen).getByText('Rostro no fotografiable')).toBeInTheDocument()
    })

    it('deja registrar la autorización después de explicar la política de imagen', async () => {
      abrirFicha(ID_ROSA)
      const imagen = await screen.findByRole('region', { name: 'Uso de imagen' })
      expect(within(imagen).getByText('Política de uso de imagen · versión 1')).toBeInTheDocument()

      await userEvent.click(within(imagen).getByRole('button', { name: AUTORIZAR_FOTOS }))

      expect(await screen.findByText('Autorización de imagen guardada')).toBeInTheDocument()
      expect(await within(imagen).findByText('Foto autorizada')).toBeInTheDocument()
      expect(within(imagen).getByText('Voluntario de Prueba')).toBeInTheDocument()
      expect(
        within(imagen).queryByRole('button', { name: AUTORIZAR_FOTOS }),
      ).not.toBeInTheDocument()
    })

    it('la insignia cambia con la respuesta, sin esperar a que se recargue la ficha', async () => {
      abrirFicha(ID_ROSA)
      const imagen = await screen.findByRole('region', { name: 'Uso de imagen' })
      servidor.use(http.get(`*/api/beneficiarios/${ID_ROSA}`, () => new Promise(() => {})))

      await userEvent.click(within(imagen).getByRole('button', { name: AUTORIZAR_FOTOS }))

      expect(await within(imagen).findByText('Foto autorizada')).toBeInTheDocument()
    })

    it('si no se guarda, lo avisa y deja reintentar', async () => {
      servidor.use(
        http.post(
          `*/api/beneficiarios/${ID_ROSA}/consentimiento`,
          () => HttpResponse.json({ statusCode: 500, message: 'Error' }, { status: 500 }),
          { once: true },
        ),
      )
      abrirFicha(ID_ROSA)
      const imagen = await screen.findByRole('region', { name: 'Uso de imagen' })

      await userEvent.click(within(imagen).getByRole('button', { name: AUTORIZAR_FOTOS }))

      expect(await screen.findByText('No se guardó la autorización de imagen')).toBeInTheDocument()
      expect(within(imagen).getByText('Rostro no fotografiable')).toBeInTheDocument()

      await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }))

      expect(await within(imagen).findByText('Foto autorizada')).toBeInTheDocument()
    })

    it('a un menor no deja autorizarla y explica por qué', async () => {
      abrirFicha(ID_CARLOS)
      const imagen = await screen.findByRole('region', { name: 'Uso de imagen' })

      const boton = within(imagen).getByRole('button', { name: AUTORIZAR_FOTOS })

      expect(boton).toBeDisabled()
      expect(boton).toHaveAccessibleDescription(/es menor de edad/i)
      expect(within(imagen).queryByText(/Política de uso de imagen/)).not.toBeInTheDocument()
    })

    it('deja retirar la autorización después de confirmarlo', async () => {
      await autorizarFotos(ID_ROSA)
      abrirFicha(ID_ROSA)
      const imagen = await screen.findByRole('region', { name: 'Uso de imagen' })

      await userEvent.click(within(imagen).getByRole('button', { name: 'Retirar autorización' }))

      expect(await screen.findByText('¿Retirar la autorización de imagen?')).toBeInTheDocument()
      expect(
        screen.getByText(/no se le podrán tomar fotos a Rosa Martínez de Osorio/),
      ).toBeInTheDocument()
      expect(within(imagen).getByText('Foto autorizada')).toBeInTheDocument()

      await userEvent.click(screen.getByRole('button', { name: 'Sí, retirarla' }))

      expect(await screen.findByText('Autorización de imagen retirada')).toBeInTheDocument()
      expect(await within(imagen).findByText('Rostro no fotografiable')).toBeInTheDocument()
      expect(within(imagen).getByRole('button', { name: AUTORIZAR_FOTOS })).toBeEnabled()
      expect(within(imagen).queryByText('Tomada por')).not.toBeInTheDocument()
    })

    it('si no confirma, la autorización sigue vigente', async () => {
      await autorizarFotos(ID_ROSA)
      abrirFicha(ID_ROSA)
      const imagen = await screen.findByRole('region', { name: 'Uso de imagen' })

      await userEvent.click(within(imagen).getByRole('button', { name: 'Retirar autorización' }))
      await userEvent.click(await screen.findByRole('button', { name: 'Cerrar' }))

      expect(within(imagen).getByText('Foto autorizada')).toBeInTheDocument()
      await expect(historialDeFotos(ID_ROSA)).resolves.toEqual([
        expect.objectContaining({ revocadoEn: null }),
      ])
    })

    it('al retirarla, la insignia cambia sin esperar a que se recargue la ficha', async () => {
      await autorizarFotos(ID_ROSA)
      abrirFicha(ID_ROSA)
      const imagen = await screen.findByRole('region', { name: 'Uso de imagen' })
      servidor.use(http.get(`*/api/beneficiarios/${ID_ROSA}`, () => new Promise(() => {})))

      await userEvent.click(within(imagen).getByRole('button', { name: 'Retirar autorización' }))
      await userEvent.click(await screen.findByRole('button', { name: 'Sí, retirarla' }))

      expect(await within(imagen).findByText('Rostro no fotografiable')).toBeInTheDocument()
    })

    it('si no se retira, lo avisa, la deja vigente y permite reintentar', async () => {
      await autorizarFotos(ID_ROSA)
      servidor.use(
        http.post(
          `*/api/beneficiarios/${ID_ROSA}/consentimiento/revocacion`,
          () => HttpResponse.json({ statusCode: 500, message: 'Error' }, { status: 500 }),
          { once: true },
        ),
      )
      abrirFicha(ID_ROSA)
      const imagen = await screen.findByRole('region', { name: 'Uso de imagen' })

      await userEvent.click(within(imagen).getByRole('button', { name: 'Retirar autorización' }))
      await userEvent.click(await screen.findByRole('button', { name: 'Sí, retirarla' }))

      expect(await screen.findByText('No se retiró la autorización de imagen')).toBeInTheDocument()
      expect(within(imagen).getByText('Foto autorizada')).toBeInTheDocument()

      await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }))

      expect(await within(imagen).findByText('Rostro no fotografiable')).toBeInTheDocument()
    })
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
