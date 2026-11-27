import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { reiniciarBeneficiariosMock } from '@/mocks/beneficiarios.ts'
import { handlers } from '@/mocks/handlers.ts'
import { POLITICA_IMAGEN } from '@/modules/beneficiarios/domain/politicaImagen.ts'
import { AutorizacionTutorHttpRepository } from '@/modules/beneficiarios/infrastructure/http/AutorizacionTutorHttpRepository.ts'
import { ConsentimientoHttpRepository } from '@/modules/beneficiarios/infrastructure/http/ConsentimientoHttpRepository.ts'
import { iniciarSesionDePrueba, renderizarApp } from '../../../../app/renderizarApp.tsx'
import { crearHttp } from '../../../../mocks/clienteDePrueba.ts'
import { servidor } from '../../../../mocks/servidor.ts'

const COORDINADORA = 'mock-token.mock-1'
const VOLUNTARIO = 'mock-token.mock-3'
const ID_MARIA = '00000000-0000-4000-8000-000000000001'
const ID_CARLOS = '00000000-0000-4000-8000-000000000002'

function abrirFicha(id: string, token: string) {
  iniciarSesionDePrueba(token)
  return renderizarApp(`/beneficiarios/${id}`)
}

function aprobarTutor(tipoDocumento: 'CC' | 'PASAPORTE' = 'CC', numeroDocumento = '52123456') {
  return new AutorizacionTutorHttpRepository(crearHttp(COORDINADORA)).registrar(ID_CARLOS, {
    nombre: 'Luz Marina Díaz',
    parentesco: 'MADRE',
    tipoDocumento,
    numeroDocumento,
    telefono: '3101234567',
    soporte: new File(['%PDF-1.4'], 'autorizacion.pdf', { type: 'application/pdf' }),
  })
}

const AUTORIZAR_POR_EL_TUTOR = 'Le expliqué al tutor y autorizó las fotos'
const PEDIR_FOTOS = 'Pedir autorización de fotos'

function autorizarFotosDelMenor() {
  return new ConsentimientoHttpRepository(crearHttp(COORDINADORA)).registrar(
    ID_CARLOS,
    POLITICA_IMAGEN,
  )
}

async function seccionImagen() {
  return screen.findByRole('region', { name: 'Uso de imagen' })
}

async function seccionTutor() {
  return screen.findByRole('region', { name: 'Tutor del menor' })
}

function dato(seccion: HTMLElement, nombre: string) {
  return within(seccion).getByText(nombre, { selector: 'dt' }).nextElementSibling!
}

describe('tutor del menor en la ficha', () => {
  beforeEach(() => {
    localStorage.clear()
    reiniciarBeneficiariosMock()
    servidor.use(...handlers)
  })

  it('la Coordinadora lo aprueba desde la ficha y vuelve a verlo en ella', async () => {
    const enrutador = abrirFicha(ID_CARLOS, COORDINADORA)
    const seccion = await seccionTutor()
    expect(within(seccion).getByText('Sin aprobar')).toBeInTheDocument()

    await userEvent.click(within(seccion).getByRole('link', { name: 'Aprobar al tutor' }))
    await screen.findByRole('heading', { name: 'Aprobar al tutor' })
    expect(enrutador.state.location.pathname).toBe(`/beneficiarios/${ID_CARLOS}/tutor`)

    await userEvent.type(screen.getByLabelText('Nombre del tutor'), 'Luz Marina Díaz', {
      delay: null,
    })
    await userEvent.click(screen.getByRole('radio', { name: 'Madre' }))
    await userEvent.type(screen.getByLabelText('Número de documento'), '52123456', { delay: null })
    await userEvent.type(screen.getByLabelText('Teléfono del tutor'), '3101234567', {
      delay: null,
    })
    await userEvent.upload(
      screen.getByLabelText('Elegir archivo'),
      new File(['%PDF-1.4'], 'autorizacion.pdf', { type: 'application/pdf' }),
    )
    await userEvent.click(screen.getByRole('checkbox', { name: 'Revisé el papel firmado' }))
    await userEvent.click(screen.getByRole('button', { name: 'Aprobar al tutor' }))

    const conTutor = await seccionTutor()
    expect(within(conTutor).getByText('Aprobado')).toBeInTheDocument()
    expect(dato(conTutor, 'Nombre')).toHaveTextContent('Luz Marina Díaz')
    expect(within(conTutor).queryByRole('link', { name: 'Aprobar al tutor' })).toBeNull()
  })

  it('a la Coordinadora le muestra todos los datos del tutor y quién lo aprobó', async () => {
    await aprobarTutor()
    abrirFicha(ID_CARLOS, COORDINADORA)

    const seccion = await seccionTutor()

    expect(dato(seccion, 'Qué es del menor')).toHaveTextContent('Madre')
    expect(dato(seccion, 'Documento')).toHaveTextContent('CC 52.123.456')
    expect(dato(seccion, 'Teléfono')).toHaveTextContent('3101234567')
    expect(within(seccion).getByText('Coordinación de Prueba')).toBeInTheDocument()
  })

  it('el pasaporte se ve con su nombre y sin puntos', async () => {
    await aprobarTutor('PASAPORTE', 'AB123456')
    abrirFicha(ID_CARLOS, COORDINADORA)

    expect(dato(await seccionTutor(), 'Documento')).toHaveTextContent('Pasaporte AB123456')
  })

  it('al Voluntario no le muestra el documento ni el teléfono del tutor', async () => {
    await aprobarTutor()
    abrirFicha(ID_CARLOS, VOLUNTARIO)

    const seccion = await seccionTutor()

    expect(dato(seccion, 'Nombre')).toHaveTextContent('Luz Marina Díaz')
    expect(dato(seccion, 'Documento')).toHaveTextContent('Solo lo ve la coordinación')
    expect(dato(seccion, 'Teléfono')).toHaveTextContent('Solo lo ve la coordinación')
    expect(within(seccion).queryByText(/52\.123\.456/)).toBeNull()
  })

  it('el Voluntario no puede aprobarlo: le dice que lo hace la coordinación', async () => {
    abrirFicha(ID_CARLOS, VOLUNTARIO)

    const seccion = await seccionTutor()

    expect(within(seccion).getByText(/Lo aprueba la coordinación/)).toBeInTheDocument()
    expect(within(seccion).queryByRole('link', { name: 'Aprobar al tutor' })).toBeNull()
  })

  it('un adulto no tiene sección de tutor', async () => {
    abrirFicha(ID_MARIA, COORDINADORA)

    await screen.findByRole('region', { name: 'Uso de imagen' })

    expect(screen.queryByRole('region', { name: 'Tutor del menor' })).toBeNull()
  })

  describe('fotos de un menor con tutor aprobado', () => {
    it('la Coordinadora le explica al tutor la política y registra la autorización', async () => {
      await aprobarTutor()
      abrirFicha(ID_CARLOS, COORDINADORA)
      const imagen = await seccionImagen()
      await userEvent.click(within(imagen).getByRole('button', { name: PEDIR_FOTOS }))
      const hoja = screen.getByRole('dialog', { name: 'Autorización de fotos' })
      expect(within(hoja).getByText(/Explíquele al tutor la política/)).toBeInTheDocument()
      expect(within(hoja).getByText('Política de uso de imagen · versión 1')).toBeInTheDocument()

      await userEvent.click(within(hoja).getByRole('button', { name: AUTORIZAR_POR_EL_TUTOR }))

      expect(await within(imagen).findByText('Foto autorizada')).toBeInTheDocument()
      expect(within(imagen).getByText('Coordinación de Prueba')).toBeInTheDocument()
    })

    it('el Voluntario no la registra: le dice que lo hace la coordinación', async () => {
      await aprobarTutor()
      abrirFicha(ID_CARLOS, VOLUNTARIO)

      const imagen = await seccionImagen()

      expect(within(imagen).getByText(/la registra la coordinación/)).toBeInTheDocument()
      expect(within(imagen).queryByRole('button', { name: PEDIR_FOTOS })).toBeNull()
    })

    it('el Voluntario sí puede retirarla', async () => {
      await aprobarTutor()
      await autorizarFotosDelMenor()
      abrirFicha(ID_CARLOS, VOLUNTARIO)
      const imagen = await seccionImagen()

      await userEvent.click(within(imagen).getByRole('button', { name: 'Retirar autorización' }))
      await userEvent.click(await screen.findByRole('button', { name: 'Sí, retirarla' }))

      expect(await within(imagen).findByText('Rostro no fotografiable')).toBeInTheDocument()
    })
  })

  describe('revocar al tutor', () => {
    async function abrirRevocacion() {
      const seccion = await seccionTutor()
      await userEvent.click(within(seccion).getByRole('button', { name: 'Revocar al tutor' }))
      return seccion
    }

    async function escribirMotivo(motivo: string) {
      await userEvent.type(screen.getByLabelText('Motivo de la revocación'), motivo, {
        delay: null,
      })
    }

    it('con el motivo y la confirmación, lo revoca y retira las fotos del menor', async () => {
      await aprobarTutor()
      await autorizarFotosDelMenor()
      abrirFicha(ID_CARLOS, COORDINADORA)
      const seccion = await abrirRevocacion()
      expect(screen.getByLabelText('Motivo de la revocación')).toHaveFocus()

      await escribirMotivo('La madre pidió que no le tomen más fotos.')
      await userEvent.click(within(seccion).getByRole('button', { name: 'Revocar al tutor' }))
      expect(
        await screen.findByText(/También se retira la autorización de fotos/),
      ).toBeInTheDocument()
      await userEvent.click(screen.getByRole('button', { name: 'Sí, revocarlo' }))

      expect(await screen.findByText('Tutor revocado')).toBeInTheDocument()
      const sinTutor = await seccionTutor()
      expect(within(sinTutor).getByText('Sin aprobar')).toBeInTheDocument()
      expect(within(sinTutor).getByRole('link', { name: 'Aprobar al tutor' })).toBeInTheDocument()
      const imagen = await seccionImagen()
      expect(within(imagen).getByText('Primero hay que aprobar a su tutor.')).toBeInTheDocument()
      expect(within(imagen).queryByRole('button', { name: 'Retirar autorización' })).toBeNull()
    })

    it('sin fotos autorizadas, la confirmación no habla de fotos', async () => {
      await aprobarTutor()
      abrirFicha(ID_CARLOS, COORDINADORA)
      await abrirRevocacion()
      await escribirMotivo('Se aprobó por error.')

      await userEvent.click(screen.getByRole('button', { name: 'Revocar al tutor' }))

      expect(await screen.findByText(/dejará de ser el tutor aprobado/)).toBeInTheDocument()
      expect(screen.queryByText(/retira la autorización de fotos/)).toBeNull()
    })

    it('sin motivo no pide confirmación y dice qué falta', async () => {
      await aprobarTutor()
      abrirFicha(ID_CARLOS, COORDINADORA)
      const seccion = await abrirRevocacion()
      await escribirMotivo('   ')

      await userEvent.click(within(seccion).getByRole('button', { name: 'Revocar al tutor' }))

      expect(screen.getByLabelText('Motivo de la revocación')).toHaveAccessibleDescription(
        'Escriba por qué se revoca al tutor.',
      )
      expect(screen.queryByRole('button', { name: 'Sí, revocarlo' })).toBeNull()
    })

    it('el motivo no pasa de 255 caracteres y muestra cuántos van', async () => {
      await aprobarTutor()
      abrirFicha(ID_CARLOS, COORDINADORA)
      const seccion = await abrirRevocacion()

      await escribirMotivo('Cambió')

      expect(screen.getByLabelText('Motivo de la revocación')).toHaveAttribute('maxlength', '255')
      expect(within(seccion).getByText('6/255')).toBeInTheDocument()
    })

    it('al cancelar vuelve el botón y se borra lo escrito', async () => {
      await aprobarTutor()
      abrirFicha(ID_CARLOS, COORDINADORA)
      const seccion = await abrirRevocacion()
      await escribirMotivo('Algo')

      await userEvent.click(within(seccion).getByRole('button', { name: 'Cancelar' }))
      expect(screen.queryByLabelText('Motivo de la revocación')).toBeNull()
      await abrirRevocacion()

      expect(screen.getByLabelText('Motivo de la revocación')).toHaveValue('')
    })

    it('si falla, conserva el motivo y Reintentar lo vuelve a intentar', async () => {
      await aprobarTutor()
      servidor.use(
        http.post(
          '*/beneficiarios/:id/autorizacion-tutor/revocacion',
          () => HttpResponse.json({}, { status: 500 }),
          { once: true },
        ),
      )
      abrirFicha(ID_CARLOS, COORDINADORA)
      const seccion = await abrirRevocacion()
      await escribirMotivo('Cambió el acudiente.')

      await userEvent.click(within(seccion).getByRole('button', { name: 'Revocar al tutor' }))
      await userEvent.click(await screen.findByRole('button', { name: 'Sí, revocarlo' }))

      expect(await screen.findByText('No se revocó al tutor')).toBeInTheDocument()
      expect(screen.getByLabelText('Motivo de la revocación')).toHaveValue('Cambió el acudiente.')

      await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }))

      expect(await screen.findByText('Tutor revocado')).toBeInTheDocument()
    })

    it('el Voluntario no puede revocarlo', async () => {
      await aprobarTutor()
      abrirFicha(ID_CARLOS, VOLUNTARIO)

      const seccion = await seccionTutor()

      expect(within(seccion).queryByRole('button', { name: 'Revocar al tutor' })).toBeNull()
    })
  })

  describe('al cumplir 18', () => {
    beforeEach(async () => {
      vi.useFakeTimers({ toFake: ['Date'], now: new Date('2026-11-23T15:00:00Z') })
      await aprobarTutor()
      await autorizarFotosDelMenor()
      vi.setSystemTime(new Date('2032-04-01T15:00:00Z'))
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('avisa que lo que autorizó el tutor ya no vale y le pide la suya', async () => {
      abrirFicha(ID_CARLOS, VOLUNTARIO)
      const imagen = await seccionImagen()

      expect(within(imagen).getByText(/Cumplió 18 años/)).toBeInTheDocument()
      expect(within(imagen).getByText('Rostro no fotografiable')).toBeInTheDocument()
      expect(within(imagen).queryByRole('button', { name: 'Retirar autorización' })).toBeNull()
      expect(screen.queryByRole('region', { name: 'Tutor del menor' })).toBeNull()

      await userEvent.click(within(imagen).getByRole('button', { name: PEDIR_FOTOS }))
      await userEvent.click(
        screen.getByRole('button', { name: 'Le expliqué y autorizó las fotos' }),
      )

      expect(await within(imagen).findByText('Foto autorizada')).toBeInTheDocument()
      expect(within(imagen).getByText('Voluntario de Prueba')).toBeInTheDocument()
    })
  })
})
