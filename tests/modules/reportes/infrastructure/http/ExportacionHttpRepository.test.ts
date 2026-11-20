import { http, HttpResponse } from 'msw'
import { describe, expect, it, vi } from 'vitest'
import { ExportacionHttpRepository } from '@/modules/reportes/infrastructure/http/ExportacionHttpRepository.ts'
import { AxiosHttpClient } from '@/shared/infrastructure/http/AxiosHttpClient.ts'
import { servidor } from '../../../../mocks/servidor.ts'

const repositorio = new ExportacionHttpRepository(
  new AxiosHttpClient({
    baseUrl: '/api',
    sesion: { obtenerToken: () => 'jwt', alExpirarSesion: vi.fn() },
  }),
)

const RANGO = { desde: '2026-11-01', hasta: '2026-11-19' }

describe('ExportacionHttpRepository', () => {
  describe('consultarResumen', () => {
    it('envía GET /exportaciones/beneficiarios/resumen con el rango', async () => {
      let recibida: URL | undefined
      servidor.use(
        http.get('*/api/exportaciones/beneficiarios/resumen', ({ request }) => {
          recibida = new URL(request.url)
          return HttpResponse.json({ asistieron: 24, incluidas: 20, excluidas: 4 })
        }),
      )

      const resumen = await repositorio.consultarResumen(RANGO)

      expect(recibida?.searchParams.get('desde')).toBe('2026-11-01')
      expect(recibida?.searchParams.get('hasta')).toBe('2026-11-19')
      expect(resumen).toEqual({ asistieron: 24, incluidas: 20, excluidas: 4 })
    })

    it('rechaza cantidades que no son enteros positivos', async () => {
      servidor.use(
        http.get('*/api/exportaciones/beneficiarios/resumen', () =>
          HttpResponse.json({ asistieron: -1, incluidas: '20', excluidas: 4 }),
        ),
      )

      await expect(repositorio.consultarResumen(RANGO)).rejects.toMatchObject({
        tipo: 'respuesta-invalida',
      })
    })
  })

  describe('generarPadron', () => {
    it('pide el .xlsx del rango, dejando constancia de la responsabilidad aceptada', async () => {
      let recibida: URL | undefined
      servidor.use(
        http.get('*/api/exportaciones/beneficiarios.xlsx', ({ request }) => {
          recibida = new URL(request.url)
          return new HttpResponse(new Uint8Array([80, 75]), {
            headers: { 'Content-Disposition': 'attachment; filename="padron-noviembre.xlsx"' },
          })
        }),
      )

      const archivo = await repositorio.generarPadron(RANGO)

      expect(Object.fromEntries(recibida?.searchParams ?? [])).toEqual({
        desde: '2026-11-01',
        hasta: '2026-11-19',
        responsabilidadAceptada: 'true',
      })
      expect(archivo.nombre).toBe('padron-noviembre.xlsx')
      expect(archivo.contenido.size).toBe(2)
    })

    it('si el servidor no propone nombre, usa uno con las fechas', async () => {
      servidor.use(
        http.get(
          '*/api/exportaciones/beneficiarios.xlsx',
          () => new HttpResponse(new Uint8Array([80, 75])),
        ),
      )

      const archivo = await repositorio.generarPadron(RANGO)

      expect(archivo.nombre).toBe('padron-beneficiarios_2026-11-01_a_2026-11-19.xlsx')
    })
  })
})
