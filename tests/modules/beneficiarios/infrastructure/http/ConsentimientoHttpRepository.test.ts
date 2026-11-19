import { http, HttpResponse } from 'msw'
import { describe, expect, it, vi } from 'vitest'
import { ConsentimientoHttpRepository } from '@/modules/beneficiarios/infrastructure/http/ConsentimientoHttpRepository.ts'
import { AxiosHttpClient } from '@/shared/infrastructure/http/AxiosHttpClient.ts'
import { servidor } from '../../../../mocks/servidor.ts'
import { MARIA } from '../../datosDePrueba.ts'

const repositorio = new ConsentimientoHttpRepository(
  new AxiosHttpClient({
    baseUrl: '/api',
    sesion: { obtenerToken: () => 'jwt', alExpirarSesion: vi.fn() },
  }),
)

const DTO_CONSENTIMIENTO = {
  id: 'c-1',
  beneficiarioId: MARIA.id,
  versionPolitica: 1,
  finalidad: 'ATENCION_ALIMENTARIA',
  registradoPor: { id: 'u-1', nombreCompleto: 'Voluntario de Prueba' },
  createdAt: '2026-11-19T15:00:00.000Z',
}

describe('ConsentimientoHttpRepository', () => {
  it('registrar envía POST /beneficiarios/:id/consentimiento con la política aceptada', async () => {
    const recibida: { url?: URL; cuerpo?: unknown } = {}
    servidor.use(
      http.post('*/api/beneficiarios/:id/consentimiento', async ({ request }) => {
        recibida.url = new URL(request.url)
        recibida.cuerpo = await request.json()
        return HttpResponse.json(DTO_CONSENTIMIENTO, { status: 201 })
      }),
    )

    const consentimiento = await repositorio.registrar(MARIA.id, {
      version: 1,
      finalidad: 'ATENCION_ALIMENTARIA',
    })

    expect(recibida.url?.pathname).toBe(`/api/beneficiarios/${MARIA.id}/consentimiento`)
    expect(recibida.cuerpo).toEqual({ versionPolitica: 1, finalidad: 'ATENCION_ALIMENTARIA' })
    expect(consentimiento).toEqual({
      versionPolitica: 1,
      finalidad: 'ATENCION_ALIMENTARIA',
      registradoEn: '2026-11-19T15:00:00.000Z',
      registradoPor: 'Voluntario de Prueba',
    })
  })
})
