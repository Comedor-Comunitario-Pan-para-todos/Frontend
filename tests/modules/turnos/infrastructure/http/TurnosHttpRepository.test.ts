import { http, HttpResponse } from 'msw'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { JornadaNoDisponible } from '@/modules/turnos/domain/JornadaNoDisponible.ts'
import { TurnoYaEntregado } from '@/modules/turnos/domain/TurnoYaEntregado.ts'
import { TurnosHttpRepository } from '@/modules/turnos/infrastructure/http/TurnosHttpRepository.ts'
import { ErrorApi } from '@/shared/application/errores/ErrorApi.ts'
import { AxiosHttpClient } from '@/shared/infrastructure/http/AxiosHttpClient.ts'
import { servidor } from '../../../../mocks/servidor.ts'
import { TURNO_JORGE, TURNO_LUZ } from '../../datosDePrueba.ts'

const repositorio = new TurnosHttpRepository(
  new AxiosHttpClient({
    baseUrl: '/api',
    sesion: { obtenerToken: () => 'jwt', alExpirarSesion: vi.fn() },
  }),
)

function errorNest(estado: number, mensaje: string, error: string) {
  return HttpResponse.json({ statusCode: estado, message: mensaje, error }, { status: estado })
}

function listaDeHoy(turnos: unknown[]) {
  return http.get('*/api/turnos', () => HttpResponse.json(turnos))
}

describe('TurnosHttpRepository', () => {
  beforeEach(() => {
    // 24 de noviembre de 2026 a las 7 p. m. en Bogotá: ya es 25 en UTC.
    vi.useFakeTimers({ toFake: ['Date'], now: new Date('2026-11-25T00:00:00Z') })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('consultarDeHoy pide GET /turnos con la fecha de hoy en Bogotá', async () => {
    let fecha: string | null = null
    servidor.use(
      http.get('*/api/turnos', ({ request }) => {
        fecha = new URL(request.url).searchParams.get('fecha')
        return HttpResponse.json([TURNO_JORGE, TURNO_LUZ])
      }),
    )

    const turnos = await repositorio.consultarDeHoy()

    expect(fecha).toBe('2026-11-24')
    expect(turnos).toEqual([TURNO_JORGE, TURNO_LUZ])
  })

  it('entregar envía POST /turnos con la persona y devuelve el turno nuevo', async () => {
    let cuerpo: unknown
    servidor.use(
      http.post('*/api/turnos', async ({ request }) => {
        cuerpo = await request.json()
        return HttpResponse.json(TURNO_JORGE, { status: 201 })
      }),
    )

    const turno = await repositorio.entregar('ben-jorge')

    expect(cuerpo).toEqual({ beneficiarioId: 'ben-jorge' })
    expect(turno).toEqual(TURNO_JORGE)
  })

  it('con un 409 avisa que ya tenía turno y trae el que le entregaron', async () => {
    servidor.use(
      http.post('*/api/turnos', () => errorNest(409, 'Ya tiene turno hoy', 'Conflict')),
      listaDeHoy([TURNO_JORGE, TURNO_LUZ]),
    )

    const error = await repositorio.entregar('ben-luz').catch((e: unknown) => e)

    expect(error).toBeInstanceOf(TurnoYaEntregado)
    expect((error as TurnoYaEntregado).turno).toEqual(TURNO_LUZ)
  })

  it('con un 409 sin turno en la lista deja el error del servidor tal cual', async () => {
    servidor.use(
      http.post('*/api/turnos', () => errorNest(409, 'Ya tiene turno hoy', 'Conflict')),
      listaDeHoy([TURNO_JORGE]),
    )

    await expect(repositorio.entregar('ben-luz')).rejects.toMatchObject({ tipo: 'conflicto' })
  })

  it('con un 422 avisa que la jornada no está disponible', async () => {
    servidor.use(
      http.post('*/api/turnos', () =>
        errorNest(422, 'No hay jornada abierta', 'Unprocessable Entity'),
      ),
    )

    await expect(repositorio.entregar('ben-jorge')).rejects.toBeInstanceOf(JornadaNoDisponible)
  })

  it('deja pasar los demás errores sin cambiarlos', async () => {
    servidor.use(
      http.post('*/api/turnos', () =>
        errorNest(500, 'Internal server error', 'Internal Server Error'),
      ),
    )

    await expect(repositorio.entregar('ben-jorge')).rejects.toMatchObject({ tipo: 'servidor' })
  })

  it('rechaza una lista que no cumple el contrato', async () => {
    servidor.use(listaDeHoy([{ id: 'turno-1', numero: 0 }]))

    await expect(repositorio.consultarDeHoy()).rejects.toBeInstanceOf(ErrorApi)
    await expect(repositorio.consultarDeHoy()).rejects.toMatchObject({
      tipo: 'respuesta-invalida',
    })
  })
})
