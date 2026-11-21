import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { reiniciarBeneficiariosMock } from '@/mocks/beneficiarios.ts'
import { handlers } from '@/mocks/handlers.ts'
import { DESDE_SERVIDOR_CAIDO } from '@/mocks/reportes.ts'
import { iniciarSesionDePrueba, renderizarApp } from '../../../../app/renderizarApp.tsx'
import { servidor } from '../../../../mocks/servidor.ts'

const COORDINADORA = 'mock-token.mock-1'
const PRESIDENTE = 'mock-token.mock-2'
const DONANTE = 'mock-token.mock-4'

// 19/11/2026 a las 10 a. m. en Colombia.
const AHORA = new Date('2026-11-19T15:00:00.000Z')

const descargas: { nombre: string; href: string }[] = []

function abrirReportes(token = PRESIDENTE) {
  iniciarSesionDePrueba(token)
  return renderizarApp('/reportes')
}

function campo(nombre: 'Desde' | 'Hasta') {
  return screen.getByLabelText(nombre)
}

function cambiarFecha(nombre: 'Desde' | 'Hasta', valor: string) {
  fireEvent.change(campo(nombre), { target: { value: valor } })
}

function cifra(etiqueta: string) {
  return screen.getByText(etiqueta, { selector: 'dt' }).nextElementSibling!
}

async function esperarConteos(asistieron: string) {
  await waitFor(() => expect(cifra('Asistieron en el rango')).toHaveTextContent(asistieron))
}

function botonDescargar() {
  return screen.getByRole('button', { name: 'Descargar Excel (.xlsx)' })
}

// Sin respuesta propia, MSW pasa la petición al mock real.
function retenerArchivo(): () => void {
  let soltar!: () => void
  const retenido = new Promise<void>((resolver) => (soltar = resolver))
  servidor.use(
    http.get('*/exportaciones/beneficiarios.xlsx', async () => {
      await retenido
    }),
  )
  return soltar
}

async function confirmarDescarga() {
  await userEvent.click(botonDescargar())
  const dialogo = await screen.findByRole('dialog', { name: 'Confirmar descarga' })
  await userEvent.click(
    within(dialogo).getByRole('checkbox', {
      name: 'Entiendo que soy responsable del manejo de estos datos',
    }),
  )
  await userEvent.click(within(dialogo).getByRole('button', { name: 'Confirmar y descargar' }))
}

describe('exportar el padrón para la Alcaldía', () => {
  beforeEach(() => {
    // Solo se fija la fecha: los temporizadores siguen reales para MSW y user-event.
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(AHORA)
    localStorage.clear()
    reiniciarBeneficiariosMock()
    servidor.use(...handlers)
    descargas.length = 0
    URL.createObjectURL = vi.fn(() => 'blob:padron')
    URL.revokeObjectURL = vi.fn()
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
      this: HTMLAnchorElement,
    ) {
      descargas.push({ nombre: this.download, href: this.href })
    })
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('el Presidente de la JAC ve el aviso de Habeas Data y los conteos de este mes', async () => {
    abrirReportes()

    expect(
      await screen.findByRole('heading', { name: 'Padrón de beneficiarios' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Datos personales confidenciales')).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'Este mes' })).toBeChecked()
    expect(campo('Desde')).toHaveValue('2026-11-01')
    expect(campo('Hasta')).toHaveValue('2026-11-19')

    await esperarConteos('24')
    expect(cifra('Se incluyen en el archivo')).toHaveTextContent('20')
    expect(cifra('Se excluyen: no autorizaron')).toHaveTextContent('4')
    expect(botonDescargar()).toBeEnabled()
  })

  it('un atajo llena las fechas y al escribirlas a mano ya no queda marcado', async () => {
    abrirReportes()
    await esperarConteos('24')

    await userEvent.click(screen.getByRole('radio', { name: 'Mes pasado' }))

    expect(campo('Desde')).toHaveValue('2026-10-01')
    expect(campo('Hasta')).toHaveValue('2026-10-31')

    cambiarFecha('Desde', '2026-10-05')

    for (const atajo of screen.getAllByRole('radio')) expect(atajo).not.toBeChecked()
  })

  it('con el inicio después del final avisa en el campo y no deja descargar', async () => {
    abrirReportes()
    await esperarConteos('24')

    cambiarFecha('Desde', '2026-11-25')

    expect(await screen.findByText('La fecha no puede ser posterior a hoy.')).toBeInTheDocument()

    cambiarFecha('Desde', '2026-11-10')
    cambiarFecha('Hasta', '2026-11-02')

    expect(
      await screen.findByText('Debe ser anterior o igual a la fecha final.'),
    ).toBeInTheDocument()
    expect(
      screen.getByText('Corrija las fechas para ver cuántas personas incluye el archivo.'),
    ).toBeInTheDocument()
    expect(botonDescargar()).toBeDisabled()
  })

  it('si nadie asistió en el rango lo explica y no deja descargar', async () => {
    abrirReportes()
    await esperarConteos('24')

    cambiarFecha('Desde', '2026-01-01')
    cambiarFecha('Hasta', '2026-01-05')

    await esperarConteos('0')
    expect(
      screen.getByText(
        'Nadie asistió entre esas fechas. Elija otro rango para generar el archivo.',
      ),
    ).toBeInTheDocument()
    expect(botonDescargar()).toBeDisabled()
  })

  it('pide aceptar la responsabilidad antes de descargar y deja el archivo en el teléfono', async () => {
    abrirReportes()
    await esperarConteos('24')

    await userEvent.click(botonDescargar())
    const dialogo = await screen.findByRole('dialog', { name: 'Confirmar descarga' })

    expect(within(dialogo).getByText('01/11/2026 – 19/11/2026')).toBeInTheDocument()
    expect(within(dialogo).getByText('Personas incluidas').nextElementSibling).toHaveTextContent(
      '20',
    )
    expect(within(dialogo).getByText('Usted es responsable de este archivo')).toBeInTheDocument()
    expect(within(dialogo).getByRole('button', { name: 'Confirmar y descargar' })).toBeDisabled()

    await userEvent.click(
      within(dialogo).getByRole('checkbox', {
        name: 'Entiendo que soy responsable del manejo de estos datos',
      }),
    )
    const soltarArchivo = retenerArchivo()
    await userEvent.click(within(dialogo).getByRole('button', { name: 'Confirmar y descargar' }))

    expect(screen.getByRole('button', { name: 'Generando archivo…' })).toBeDisabled()
    expect(screen.getByRole('progressbar', { name: 'Avance de la descarga' })).toBeInTheDocument()

    soltarArchivo()

    expect(await screen.findByText('Archivo descargado')).toBeInTheDocument()
    expect(descargas).toEqual([
      { nombre: 'padron-beneficiarios_2026-11-01_a_2026-11-19.xlsx', href: 'blob:padron' },
    ])
    expect(botonDescargar()).toBeEnabled()
  })

  it('cancelar no descarga nada y la casilla vuelve a empezar sin marcar', async () => {
    abrirReportes()
    await esperarConteos('24')

    await userEvent.click(botonDescargar())
    let dialogo = await screen.findByRole('dialog', { name: 'Confirmar descarga' })
    await userEvent.click(within(dialogo).getByRole('checkbox'))
    await userEvent.click(within(dialogo).getByRole('button', { name: 'Cancelar' }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

    await userEvent.click(botonDescargar())
    dialogo = await screen.findByRole('dialog', { name: 'Confirmar descarga' })

    expect(within(dialogo).getByRole('checkbox')).not.toBeChecked()
    expect(descargas).toEqual([])
  })

  it('si el servidor falla avisa con «Reintentar» y conserva las fechas', async () => {
    abrirReportes()
    await esperarConteos('24')
    cambiarFecha('Desde', DESDE_SERVIDOR_CAIDO)
    await waitFor(() => expect(botonDescargar()).toBeEnabled())

    await confirmarDescarga()

    expect(await screen.findByText('No se pudo generar el archivo')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Reintentar' })).toBeInTheDocument()
    expect(campo('Desde')).toHaveValue(DESDE_SERVIDOR_CAIDO)
    expect(descargas).toEqual([])
  })

  it('si no se puede contar a las personas deja reintentar', async () => {
    let fallar = true
    servidor.use(
      http.get('*/exportaciones/beneficiarios/resumen', () =>
        fallar
          ? HttpResponse.json({ message: 'Internal server error' }, { status: 500 })
          : HttpResponse.json({ asistieron: 3, incluidas: 2, excluidas: 1 }),
      ),
    )
    abrirReportes()

    expect(await screen.findByText(/No se pudo contar a las personas/)).toBeInTheDocument()
    expect(botonDescargar()).toBeDisabled()

    fallar = false
    await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }))

    await esperarConteos('3')
    expect(botonDescargar()).toBeEnabled()
  })

  it('muestra quién puede generar el archivo', async () => {
    abrirReportes()

    expect(
      await screen.findByText('Solo el Presidente de la JAC puede generar este archivo.'),
    ).toBeInTheDocument()
  })

  it.each([
    ['la Coordinadora', COORDINADORA],
    ['el Donante', DONANTE],
  ])('%s ve «Próximamente», sin el padrón', async (_rol, token) => {
    abrirReportes(token)

    expect(await screen.findByText('Este módulo estará disponible pronto.')).toBeInTheDocument()
    expect(
      screen.queryByRole('heading', { name: 'Padrón de beneficiarios' }),
    ).not.toBeInTheDocument()
  })
})
