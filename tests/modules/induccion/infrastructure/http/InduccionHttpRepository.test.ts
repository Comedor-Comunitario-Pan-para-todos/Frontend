import { http, HttpResponse } from 'msw'
import { describe, expect, it, vi } from 'vitest'
import { InduccionHttpRepository } from '@/modules/induccion/infrastructure/http/InduccionHttpRepository.ts'
import { ErrorApi } from '@/shared/application/errores/ErrorApi.ts'
import { AxiosHttpClient } from '@/shared/infrastructure/http/AxiosHttpClient.ts'
import { servidor } from '../../../../mocks/servidor.ts'
import { HIGIENE, TRATO_DIGNO } from '../../datosDePrueba.ts'

const repositorio = new InduccionHttpRepository(
  new AxiosHttpClient({
    baseUrl: '/api',
    sesion: { obtenerToken: () => 'jwt', alExpirarSesion: vi.fn() },
  }),
)

describe('InduccionHttpRepository', () => {
  it('consultar pide GET /induccion y entrega los temas y el progreso', async () => {
    servidor.use(
      http.get('*/api/induccion', () =>
        HttpResponse.json({
          modulos: [{ ...HIGIENE, creadoEn: '2026-11-01' }, TRATO_DIGNO],
          progreso: { modulosLeidos: ['higiene'] },
        }),
      ),
    )

    const guia = await repositorio.consultar()

    expect(guia).toEqual({
      modulos: [HIGIENE, TRATO_DIGNO],
      progreso: { modulosLeidos: ['higiene'] },
    })
  })

  it('registrarLectura envía PATCH /induccion/progreso con el tema y si lo leyó', async () => {
    let cuerpo: unknown
    servidor.use(
      http.patch('*/api/induccion/progreso', async ({ request }) => {
        cuerpo = await request.json()
        return HttpResponse.json({ modulosLeidos: ['higiene', 'trato-digno'] })
      }),
    )

    const progreso = await repositorio.registrarLectura('trato-digno', true)

    expect(cuerpo).toEqual({ moduloId: 'trato-digno', leido: true })
    expect(progreso).toEqual({ modulosLeidos: ['higiene', 'trato-digno'] })
  })

  it('rechaza una respuesta que no cumple el contrato', async () => {
    servidor.use(
      http.get('*/api/induccion', () => HttpResponse.json({ modulos: [{ id: 'higiene' }] })),
    )

    await expect(repositorio.consultar()).rejects.toMatchObject({ tipo: 'respuesta-invalida' })
    await expect(repositorio.consultar()).rejects.toBeInstanceOf(ErrorApi)
  })
})
