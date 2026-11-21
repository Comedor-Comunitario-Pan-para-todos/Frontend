import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { esPeticionDeLaApi } from '@/mocks/browser.ts'
import { handlers } from '@/mocks/handlers.ts'
import { servidor } from '../mocks/servidor.ts'

const ORIGEN = 'http://localhost:5173'

describe('modo mock (pnpm dev:mock)', () => {
  describe('esPeticionDeLaApi', () => {
    it.each([
      'http://localhost:5173/api/beneficiarios/00000000-0000-4000-8000-000000000001',
      'http://localhost:5173/api/exportaciones/beneficiarios.xlsx?desde=2026-11-01',
      'http://localhost:5173/api',
    ])('%s va a la API', (url) => {
      expect(esPeticionDeLaApi(url, '/api', ORIGEN)).toBe(true)
    })

    it.each([
      // Módulos que sirve Vite: el mock de beneficiarios los tomaría por un id.
      'http://localhost:5173/src/modules/beneficiarios/index.ts',
      'http://localhost:5173/src/main.tsx',
      'http://localhost:5173/apiario.png',
      'http://localhost:5173/',
    ])('%s no va a la API', (url) => {
      expect(esPeticionDeLaApi(url, '/api', ORIGEN)).toBe(false)
    })

    it('acepta una URL base completa', () => {
      const base = 'https://api.comedor.org/v1/'

      expect(esPeticionDeLaApi('https://api.comedor.org/v1/auth/me', base, ORIGEN)).toBe(true)
      expect(esPeticionDeLaApi('http://localhost:5173/v1/auth/me', base, ORIGEN)).toBe(false)
    })
  })

  // Si el mock respondiera a la carga de la página, recargar mostraría un 401.
  it.each(['/beneficiarios', '/beneficiarios/nuevo', '/induccion'])(
    'deja pasar la carga de la página %s',
    async (ruta) => {
      servidor.use(
        ...handlers,
        http.get(`*${ruta}`, () => HttpResponse.html('<p>La aplicación</p>')),
      )

      const respuesta = await fetch(`http://localhost${ruta}`, {
        headers: { Accept: 'text/html,application/xhtml+xml' },
      })

      await expect(respuesta.text()).resolves.toBe('<p>La aplicación</p>')
    },
  )
})
