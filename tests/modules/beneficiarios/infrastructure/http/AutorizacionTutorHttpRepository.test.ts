import { http, HttpResponse } from 'msw'
import { describe, expect, it, vi } from 'vitest'
import { AutorizacionTutorHttpRepository } from '@/modules/beneficiarios/infrastructure/http/AutorizacionTutorHttpRepository.ts'
import { AxiosHttpClient } from '@/shared/infrastructure/http/AxiosHttpClient.ts'
import type { HttpClient } from '@/shared/infrastructure/http/HttpClient.ts'
import { servidor } from '../../../../mocks/servidor.ts'
import { TUTOR_ACTIVO, TUTOR_REVOCADO } from '../../consentimientosDePrueba.ts'
import { CARLOS } from '../../datosDePrueba.ts'

const repositorio = new AutorizacionTutorHttpRepository(
  new AxiosHttpClient({
    baseUrl: '/api',
    sesion: { obtenerToken: () => 'jwt', alExpirarSesion: vi.fn() },
  }),
)

const DTO_TUTOR_ACTIVO = {
  id: 'at-1',
  estado: 'ACTIVA',
  tutor: {
    nombre: 'Luz Marina Díaz',
    tipoDocumento: 'CC',
    numeroDocumento: '52123456',
    parentesco: 'MADRE',
    telefono: '3101234567',
  },
  aprobadaPor: { id: 'u-2', nombreCompleto: 'Coordinación de Prueba' },
  fechaAprobacion: '2026-11-18T15:00:00.000Z',
  revocadaEn: null,
  revocadaPor: null,
  motivoRevocacion: null,
}

const DATOS = {
  nombre: 'Luz Marina Díaz',
  tipoDocumento: 'CC',
  numeroDocumento: '52123456',
  parentesco: 'MADRE',
  telefono: '3101234567',
  soporte: new File(['firma'], 'firma.jpg', { type: 'image/jpeg' }),
} as const

describe('AutorizacionTutorHttpRepository', () => {
  it('registrar envía POST /beneficiarios/:id/autorizacion-tutor en multipart, con el soporte', async () => {
    const recibida: { url?: URL; tipo?: string | null; cuerpo?: string } = {}
    servidor.use(
      http.post('*/api/beneficiarios/:id/autorizacion-tutor', async ({ request }) => {
        recibida.url = new URL(request.url)
        recibida.tipo = request.headers.get('Content-Type')
        recibida.cuerpo = await request.text()
        return HttpResponse.json(DTO_TUTOR_ACTIVO, { status: 201 })
      }),
    )

    const autorizacion = await repositorio.registrar(CARLOS.id, DATOS)

    expect(recibida.url?.pathname).toBe(`/api/beneficiarios/${CARLOS.id}/autorizacion-tutor`)
    expect(recibida.tipo).toMatch(/^multipart\/form-data/)
    for (const [campo, valor] of [
      ['nombre', 'Luz Marina Díaz'],
      ['tipoDocumento', 'CC'],
      ['numeroDocumento', '52123456'],
      ['parentesco', 'MADRE'],
      ['telefono', '3101234567'],
    ]) {
      expect(recibida.cuerpo).toContain(`name="${campo}"\r\n\r\n${valor}\r\n`)
    }
    expect(recibida.cuerpo).toContain(
      'name="soporte"; filename="firma.jpg"\r\nContent-Type: image/jpeg\r\n\r\nfirma\r\n',
    )
    expect(autorizacion).toEqual(TUTOR_ACTIVO)
  })

  it('registrar espera hasta 60 s a que suba el soporte', async () => {
    const cliente = { post: vi.fn().mockResolvedValue(TUTOR_ACTIVO) }

    await new AutorizacionTutorHttpRepository(cliente as unknown as HttpClient).registrar(
      CARLOS.id,
      DATOS,
    )

    expect(cliente.post).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(FormData),
      expect.objectContaining({ tiempoLimiteMs: 60_000 }),
    )
  })

  it('revocar envía POST …/autorizacion-tutor/revocacion con el motivo', async () => {
    const recibida: { url?: URL; cuerpo?: unknown } = {}
    servidor.use(
      http.post('*/api/beneficiarios/:id/autorizacion-tutor/revocacion', async ({ request }) => {
        recibida.url = new URL(request.url)
        recibida.cuerpo = await request.json()
        return HttpResponse.json({
          ...DTO_TUTOR_ACTIVO,
          estado: 'REVOCADA',
          revocadaEn: '2026-11-19T10:00:00.000Z',
          revocadaPor: { id: 'u-2', nombreCompleto: 'Coordinación de Prueba' },
          motivoRevocacion: 'El acudiente ya no está a cargo.',
        })
      }),
    )

    const revocada = await repositorio.revocar(CARLOS.id, 'El acudiente ya no está a cargo.')

    expect(recibida.url?.pathname).toBe(
      `/api/beneficiarios/${CARLOS.id}/autorizacion-tutor/revocacion`,
    )
    expect(recibida.cuerpo).toEqual({ motivo: 'El acudiente ya no está a cargo.' })
    expect(revocada).toEqual(TUTOR_REVOCADO)
  })
})
