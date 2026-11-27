import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { beforeEach, describe, expect, it, onTestFinished, vi } from 'vitest'
import { reiniciarBeneficiariosMock } from '@/mocks/beneficiarios.ts'
import { handlers } from '@/mocks/handlers.ts'
import { iniciarSesionDePrueba, renderizarApp } from '../../../../app/renderizarApp.tsx'
import { servidor } from '../../../../mocks/servidor.ts'

const VOLUNTARIO = 'mock-token.mock-3'
// La constancia vibra con un pulso corto solo cuando algo quedó guardado.
const PULSO_DE_GUARDADO = 40

async function abrirRegistro() {
  iniciarSesionDePrueba(VOLUNTARIO)
  const enrutador = renderizarApp('/beneficiarios/nuevo')
  await screen.findByRole('heading', { name: 'Registrar persona' })
  return enrutador
}

async function escribir(campo: string, texto: string) {
  await userEvent.type(screen.getByLabelText(campo), texto, { delay: null })
}

async function llenarIdentidad(nombres = 'Persona', apellidos = 'De Prueba', fecha = '1990-01-31') {
  await escribir('Nombres', nombres)
  await escribir('Apellidos', apellidos)
  await escribir('Fecha de nacimiento', fecha)
}

async function marcar(casilla: string) {
  await userEvent.click(screen.getByRole('checkbox', { name: casilla }))
}

async function elegir(opcion: string) {
  await userEvent.click(screen.getByRole('radio', { name: opcion }))
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

  it('por defecto registra en nivel básico, sin pedir datos sensibles', async () => {
    const enrutador = await abrirRegistro()
    await llenarIdentidad()
    await marcar('Informé a la persona')

    expect(screen.getByRole('radio', { name: 'Básico' })).toBeChecked()
    expect(screen.queryByLabelText('Número de documento')).not.toBeInTheDocument()

    await registrar()

    expect(await screen.findByText('Persona registrada')).toBeInTheDocument()
    expect(
      await screen.findByRole('heading', { name: 'Persona De Prueba', level: 1 }),
    ).toBeInTheDocument()
    expect(enrutador.state.location.pathname).toMatch(/^\/beneficiarios\/[0-9a-f-]{36}$/)
  })

  it('guarda la autorización de la persona que acaba de registrar', async () => {
    const autorizadas: string[] = []
    servidor.use(
      http.post('*/api/beneficiarios/:id/consentimiento', ({ params }) => {
        autorizadas.push(String(params.id))
        return undefined
      }),
    )
    const enrutador = await abrirRegistro()
    await llenarIdentidad()
    await marcar('Informé a la persona')

    await registrar()

    expect(await screen.findByText('Persona registrada')).toBeInTheDocument()
    const idRegistrada = enrutador.state.location.pathname.split('/').at(-1)
    expect(autorizadas).toEqual([idRegistrada])
  })

  it('si no se guarda la autorización, lleva a la ficha y deja reintentar solo eso', async () => {
    const vibrar = vi.fn()
    Object.defineProperty(navigator, 'vibrate', { value: vibrar, configurable: true })
    onTestFinished(() => {
      Reflect.deleteProperty(navigator, 'vibrate')
    })
    let registros = 0
    servidor.use(
      http.post('*/api/beneficiarios', () => {
        registros += 1
        return undefined
      }),
      http.post(
        '*/api/beneficiarios/:id/consentimiento',
        () => HttpResponse.json({ statusCode: 500, message: 'Error' }, { status: 500 }),
        { once: true },
      ),
    )
    await abrirRegistro()
    await llenarIdentidad()
    await marcar('Informé a la persona')

    await registrar()

    expect(await screen.findByText('No se guardó la autorización')).toBeInTheDocument()
    expect(
      screen.getByText('Falta guardar la autorización de datos de Persona De Prueba.'),
    ).toBeInTheDocument()
    expect(
      await screen.findByRole('heading', { name: 'Persona De Prueba', level: 1 }),
    ).toBeInTheDocument()
    expect(vibrar).not.toHaveBeenCalledWith(PULSO_DE_GUARDADO)

    await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }))

    expect(await screen.findByText('Persona registrada')).toBeInTheDocument()
    expect(registros).toBe(1)
  })

  it('en nivel extendido registra documento, teléfono y clasificación', async () => {
    await abrirRegistro()
    await llenarIdentidad()
    await escribir('Barrio o sector', 'El Jardín')
    await elegir('Extendido')
    await escribir('Número de documento', '99.000.111')
    await escribir('Teléfono', '315 123 4567')
    await elegir('Registro Universal de Ingresos (RUI)')
    await escribir('Grupo', 'c12')
    await marcar('Informé a la persona')

    expect(screen.getByLabelText('Grupo')).toHaveAccessibleDescription('Vulnerable')

    await registrar()

    expect(await screen.findByText('Persona registrada')).toBeInTheDocument()
    expect(
      await screen.findByRole('heading', { name: 'Persona De Prueba', level: 1 }),
    ).toBeInTheDocument()
    expect(screen.getByText('CC ••••0111')).toBeInTheDocument()
  })

  it('en nivel extendido registra a una persona sin documento', async () => {
    await abrirRegistro()
    await llenarIdentidad()
    await elegir('Extendido')
    await marcar('Sin documento')
    await marcar('Informé a la persona')

    expect(screen.queryByLabelText('Número de documento')).not.toBeInTheDocument()

    await registrar()

    expect(
      await screen.findByRole('heading', { name: 'Persona De Prueba', level: 1 }),
    ).toBeInTheDocument()
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
    expect(screen.getByText('Indique la fecha de nacimiento.')).toBeInTheDocument()
    expect(
      screen.getByText('Marque la casilla después de explicar la política de datos.'),
    ).toBeInTheDocument()
    expect(llamadas).toBe(0)
  })

  it('en nivel extendido valida documento, teléfono y grupo', async () => {
    await abrirRegistro()
    await elegir('Extendido')
    await escribir('Teléfono', '12345')
    await elegir('Sisbén IV')
    await escribir('Grupo', 'E1')

    await registrar()

    expect(
      await screen.findByText('Escriba el número o marque «Sin documento».'),
    ).toBeInTheDocument()
    expect(
      screen.getByText('Revise el teléfono: 7 dígitos si es fijo o 10 si es celular.'),
    ).toBeInTheDocument()
    expect(screen.getByText('Escriba un grupo entre A1 y D21, como C12.')).toBeInTheDocument()
  })

  it('valida cada campo al salir de él, sin esperar a enviar', async () => {
    await abrirRegistro()
    await elegir('Extendido')

    await escribir('Teléfono', '12345')
    await userEvent.tab()

    expect(
      await screen.findByText('Revise el teléfono: 7 dígitos si es fijo o 10 si es celular.'),
    ).toBeInTheDocument()

    await escribir('Teléfono', '67')

    expect(
      screen.queryByText('Revise el teléfono: 7 dígitos si es fijo o 10 si es celular.'),
    ).not.toBeInTheDocument()
  })

  it('revisa el número según el tipo de documento', async () => {
    await abrirRegistro()
    await elegir('Extendido')

    await escribir('Número de documento', '42A85')
    await userEvent.tab()

    expect(
      await screen.findByText('Revise el número: cédula de ciudadanía lleva de 3 a 10 dígitos.'),
    ).toBeInTheDocument()

    await userEvent.click(screen.getByRole('radio', { name: /Registro civil/ }))

    expect(
      screen.queryByText('Revise el número: cédula de ciudadanía lleva de 3 a 10 dígitos.'),
    ).not.toBeInTheDocument()
    expect(
      screen.getByText('Revise el número: registro civil lleva de 6 a 11 letras o números.'),
    ).toBeInTheDocument()
  })

  it('no acepta una fecha de nacimiento futura', async () => {
    await abrirRegistro()
    await llenarIdentidad('Persona', 'De Prueba', '2999-01-01')

    await registrar()

    expect(
      await screen.findByText('La fecha de nacimiento no puede ser futura.'),
    ).toBeInTheDocument()
  })

  it('avisa que es menor de edad apenas se escribe la fecha de nacimiento', async () => {
    await abrirRegistro()

    await escribir('Fecha de nacimiento', '2015-06-01')

    expect(screen.getByText('Es menor de edad')).toBeInTheDocument()
    expect(screen.getByText(/recibe la ración como cualquier persona/i)).toBeInTheDocument()
  })

  it('no avisa de menor sin fecha, con un adulto ni con una fecha futura', async () => {
    await abrirRegistro()
    expect(screen.queryByText('Es menor de edad')).not.toBeInTheDocument()

    await escribir('Fecha de nacimiento', '1990-01-31')
    expect(screen.queryByText('Es menor de edad')).not.toBeInTheDocument()

    await userEvent.clear(screen.getByLabelText('Fecha de nacimiento'))
    await escribir('Fecha de nacimiento', '2999-01-01')
    expect(screen.queryByText('Es menor de edad')).not.toBeInTheDocument()
  })

  it('a un menor lo autoriza el adulto que lo acompaña', async () => {
    await abrirRegistro()
    expect(screen.getByRole('checkbox', { name: 'Informé a la persona' })).toBeInTheDocument()

    await llenarIdentidad('Mateo', 'Arias', '2015-06-01')
    await marcar('Informé al adulto que lo acompaña')
    await registrar()

    expect(await screen.findByText('Persona registrada')).toBeInTheDocument()
  })

  it('explica la política de datos junto a la autorización', async () => {
    await abrirRegistro()

    const autorizacion = screen.getByRole('region', { name: 'Autorización de datos' })

    expect(within(autorizacion).getByText('Leer la política completa')).toBeInTheDocument()
    expect(within(autorizacion).getByText('Política de datos · versión 1')).toBeInTheDocument()
  })

  it('el barrio es opcional y la autorización empieza desmarcada', async () => {
    await abrirRegistro()

    expect(screen.getByLabelText('Barrio o sector')).toHaveAccessibleDescription(
      'Opcional No condiciona la entrega de la ración. Si la persona no quiere decirlo, déjelo en blanco.',
    )
    expect(screen.getByRole('checkbox', { name: 'Informé a la persona' })).not.toBeChecked()
    expect(screen.getByText('Registra: Voluntario de Prueba')).toBeInTheDocument()
  })

  it('avisa mientras se escribe si el documento ya está en el padrón', async () => {
    await abrirRegistro()
    await elegir('Extendido')

    await escribir('Número de documento', '42.185.390')

    expect(
      await screen.findByText('Ya hay una persona con este documento', {}, { timeout: 3000 }),
    ).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'María Elena Restrepo' })).toBeInTheDocument()
  })

  it('avisa si coincide el nombre y la fecha de nacimiento de alguien sin documento', async () => {
    await abrirRegistro()

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
    await elegir('Extendido')
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
    await marcar('Informé a la persona')

    await registrar()

    expect(await screen.findByText('No se pudo registrar')).toBeInTheDocument()
    expect(screen.getByLabelText('Apellidos')).toHaveValue('De Prueba')

    await registrar()

    expect(
      await screen.findByRole('heading', { name: 'Persona De Prueba', level: 1 }),
    ).toBeInTheDocument()
  })

  it('cancelar vuelve al padrón sin registrar', async () => {
    const enrutador = await abrirRegistro()

    await userEvent.click(screen.getByRole('link', { name: 'Cancelar' }))

    await waitFor(() => expect(enrutador.state.location.pathname).toBe('/beneficiarios'))
    expect(await screen.findByText('24 personas en el padrón')).toBeInTheDocument()
  })
})
