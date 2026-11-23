import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
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
    expect(within(seccion).getByText(/Todavía no tiene un tutor aprobado/)).toBeInTheDocument()

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
    expect(within(conTutor).getByText('Tutor aprobado')).toBeInTheDocument()
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
    expect(dato(seccion, 'Aprobado por')).toHaveTextContent('Coordinación de Prueba')
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
      expect(within(imagen).getByText(/Explíquele al tutor la política/)).toBeInTheDocument()
      expect(within(imagen).getByText('Política de uso de imagen · versión 1')).toBeInTheDocument()

      await userEvent.click(within(imagen).getByRole('button', { name: AUTORIZAR_POR_EL_TUTOR }))

      expect(await within(imagen).findByText('Foto autorizada')).toBeInTheDocument()
      expect(within(imagen).getByText('Coordinación de Prueba')).toBeInTheDocument()
    })

    it('el Voluntario no la registra: le dice que lo hace la coordinación', async () => {
      await aprobarTutor()
      abrirFicha(ID_CARLOS, VOLUNTARIO)

      const imagen = await seccionImagen()

      expect(within(imagen).getByText(/la registra la coordinación/)).toBeInTheDocument()
      expect(within(imagen).queryByRole('button', { name: /autorizó las fotos/ })).toBeNull()
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
})
