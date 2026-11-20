import { delay, http, HttpResponse } from 'msw'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { z } from 'zod'
import { AxiosHttpClient } from '@/shared/infrastructure/http/AxiosHttpClient.ts'
import { servidor } from '../../../mocks/servidor.ts'

const URL_RECURSO = '*/api/recurso'

let token: string | null
const alExpirarSesion = vi.fn(() => {
  token = null
})

function crearCliente(tiempoLimiteMs?: number) {
  return new AxiosHttpClient({
    baseUrl: '/api',
    tiempoLimiteMs,
    sesion: { obtenerToken: () => token, alExpirarSesion },
  })
}

function responderCon(estado: number, cuerpo: Record<string, unknown> = {}) {
  servidor.use(http.get(URL_RECURSO, () => HttpResponse.json(cuerpo, { status: estado })))
}

beforeEach(() => {
  token = 'token-vigente'
  alExpirarSesion.mockClear()
})

describe('AxiosHttpClient', () => {
  describe('petición', () => {
    it('agrega el Bearer cuando hay token', async () => {
      let autorizacion: string | null = null
      servidor.use(
        http.get(URL_RECURSO, ({ request }) => {
          autorizacion = request.headers.get('Authorization')
          return HttpResponse.json({})
        }),
      )

      await crearCliente().get('/recurso')

      expect(autorizacion).toBe('Bearer token-vigente')
    })

    it('no agrega el Bearer si no hay token', async () => {
      token = null
      let autorizacion: string | null = 'sin leer'
      servidor.use(
        http.get(URL_RECURSO, ({ request }) => {
          autorizacion = request.headers.get('Authorization')
          return HttpResponse.json({})
        }),
      )

      await crearCliente().get('/recurso')

      expect(autorizacion).toBeNull()
    })

    it('no agrega el Bearer con omitirSesion', async () => {
      let autorizacion: string | null = 'sin leer'
      servidor.use(
        http.post(URL_RECURSO, ({ request }) => {
          autorizacion = request.headers.get('Authorization')
          return HttpResponse.json({})
        }),
      )

      await crearCliente().post('/recurso', {}, { omitirSesion: true })

      expect(autorizacion).toBeNull()
    })

    it('envía el cuerpo como JSON', async () => {
      let recibido: unknown
      servidor.use(
        http.patch(URL_RECURSO, async ({ request }) => {
          recibido = await request.json()
          return HttpResponse.json({})
        }),
      )

      await crearCliente().patch('/recurso', { nombre: 'Ana' })

      expect(recibido).toEqual({ nombre: 'Ana' })
    })

    it('arma la query string y descarta los valores sin definir', async () => {
      let consulta = ''
      servidor.use(
        http.get(URL_RECURSO, ({ request }) => {
          consulta = new URL(request.url).search
          return HttpResponse.json({})
        }),
      )

      await crearCliente().get('/recurso', { params: { busqueda: 'ana', barrio: undefined } })

      expect(consulta).toBe('?busqueda=ana')
    })
  })

  describe('respuesta', () => {
    const esquema = z.object({ id: z.string() })

    it('devuelve los datos validados', async () => {
      responderCon(200, { id: 'a1', sobrante: true })

      await expect(crearCliente().get('/recurso', { esquema })).resolves.toEqual({ id: 'a1' })
    })

    it('lanza respuesta-invalida si no cumple el esquema', async () => {
      responderCon(200, { id: 1 })

      await expect(crearCliente().get('/recurso', { esquema })).rejects.toMatchObject({
        tipo: 'respuesta-invalida',
      })
    })

    it('acepta una respuesta sin contenido', async () => {
      servidor.use(http.delete(URL_RECURSO, () => new HttpResponse(null, { status: 204 })))

      await expect(crearCliente().delete('/recurso')).resolves.toBeDefined()
    })
  })

  describe('errores', () => {
    it('normaliza un error con respuesta del servidor', async () => {
      responderCon(409, { statusCode: 409, message: 'Ya existe' })

      await expect(crearCliente().get('/recurso')).rejects.toMatchObject({
        tipo: 'conflicto',
        estado: 409,
        mensajesServidor: ['Ya existe'],
      })
    })

    it('reporta un error de red', async () => {
      servidor.use(http.get(URL_RECURSO, () => HttpResponse.error()))

      await expect(crearCliente().get('/recurso')).rejects.toMatchObject({ tipo: 'red' })
    })

    it('reporta el tiempo agotado', async () => {
      servidor.use(
        http.get(URL_RECURSO, async () => {
          await delay(200)
          return HttpResponse.json({})
        }),
      )

      await expect(crearCliente(20).get('/recurso')).rejects.toMatchObject({
        tipo: 'tiempo-agotado',
      })
    })

    it('reporta una petición cancelada', async () => {
      servidor.use(
        http.get(URL_RECURSO, async () => {
          await delay(200)
          return HttpResponse.json({})
        }),
      )
      const controlador = new AbortController()

      const peticion = crearCliente().get('/recurso', { signal: controlador.signal })
      controlador.abort()

      await expect(peticion).rejects.toMatchObject({ tipo: 'cancelada' })
    })
  })

  describe('sesión expirada', () => {
    it('avisa una sola vez aunque fallen varias peticiones a la vez', async () => {
      responderCon(401)
      const cliente = crearCliente()

      await Promise.allSettled([
        cliente.get('/recurso'),
        cliente.get('/recurso'),
        cliente.get('/recurso'),
      ])

      expect(alExpirarSesion).toHaveBeenCalledTimes(1)
    })

    it('no avisa en un 401 con omitirSesion', async () => {
      servidor.use(
        http.post(URL_RECURSO, () =>
          HttpResponse.json({ message: 'Credenciales inválidas' }, { status: 401 }),
        ),
      )

      await expect(
        crearCliente().post('/recurso', {}, { omitirSesion: true }),
      ).rejects.toMatchObject({
        tipo: 'no-autenticado',
        mensajesServidor: ['Credenciales inválidas'],
      })
      expect(alExpirarSesion).not.toHaveBeenCalled()
    })

    it('no avisa si el 401 corresponde a un token anterior', async () => {
      servidor.use(
        http.get(URL_RECURSO, async () => {
          await delay(30)
          return HttpResponse.json({}, { status: 401 })
        }),
      )

      const peticion = crearCliente().get('/recurso')
      await delay(5)
      token = 'token-nuevo'

      await expect(peticion).rejects.toMatchObject({ tipo: 'no-autenticado' })
      expect(alExpirarSesion).not.toHaveBeenCalled()
    })

    it('no avisa en un 403', async () => {
      responderCon(403)

      await expect(crearCliente().get('/recurso')).rejects.toMatchObject({ tipo: 'sin-permiso' })
      expect(alExpirarSesion).not.toHaveBeenCalled()
    })
  })
  describe('descargar', () => {
    const URL_ARCHIVO = '*/api/archivo.xlsx'

    it('entrega el archivo como Blob, con el nombre que propone el servidor', async () => {
      let recibida: URL | undefined
      servidor.use(
        http.get(URL_ARCHIVO, ({ request }) => {
          recibida = new URL(request.url)
          return new HttpResponse(new Uint8Array([80, 75, 3, 4]), {
            headers: {
              'Content-Type': 'application/octet-stream',
              'Content-Disposition': 'attachment; filename="padron.xlsx"',
            },
          })
        }),
      )

      const archivo = await crearCliente().descargar('/archivo.xlsx', {
        params: { desde: '2026-11-01' },
      })

      expect(recibida?.searchParams.get('desde')).toBe('2026-11-01')
      expect(archivo.nombreArchivo).toBe('padron.xlsx')
      expect(archivo.contenido).toBeInstanceOf(Blob)
      expect(archivo.contenido.size).toBe(4)
    })

    it('sin Content-Disposition el nombre queda en null', async () => {
      servidor.use(http.get(URL_ARCHIVO, () => new HttpResponse(new Uint8Array([1]))))

      const archivo = await crearCliente().descargar('/archivo.xlsx')

      expect(archivo.nombreArchivo).toBeNull()
    })

    it('envía el token y convierte los errores en ErrorApi', async () => {
      let autorizacion: string | null = null
      servidor.use(
        http.get(URL_ARCHIVO, ({ request }) => {
          autorizacion = request.headers.get('Authorization')
          return HttpResponse.json({ message: 'Forbidden resource' }, { status: 403 })
        }),
      )

      await expect(crearCliente().descargar('/archivo.xlsx')).rejects.toMatchObject({
        tipo: 'sin-permiso',
      })
      expect(autorizacion).toBe('Bearer token-vigente')
    })

    it('si falla, conserva el mensaje del servidor aunque el cuerpo llegue como Blob', async () => {
      servidor.use(
        http.get(URL_ARCHIVO, () =>
          HttpResponse.json(
            { statusCode: 409, message: 'Nadie autorizó el reporte', error: 'Conflict' },
            { status: 409 },
          ),
        ),
      )

      await expect(crearCliente().descargar('/archivo.xlsx')).rejects.toMatchObject({
        tipo: 'conflicto',
        estado: 409,
        mensajesServidor: ['Nadie autorizó el reporte'],
      })
    })

    it('si el cuerpo del error no es JSON, deja el error sin mensajes del servidor', async () => {
      servidor.use(http.get(URL_ARCHIVO, () => new HttpResponse('Bad Gateway', { status: 502 })))

      await expect(crearCliente().descargar('/archivo.xlsx')).rejects.toMatchObject({
        tipo: 'servidor',
        mensajesServidor: [],
      })
    })

    it('avisa el avance de la descarga', async () => {
      const bytes = new Uint8Array(2048)
      servidor.use(
        http.get(
          URL_ARCHIVO,
          () => new HttpResponse(bytes, { headers: { 'Content-Length': String(bytes.length) } }),
        ),
      )
      const alAvanzar = vi.fn()

      await crearCliente().descargar('/archivo.xlsx', { alAvanzar })

      expect(alAvanzar).toHaveBeenCalled()
      expect(alAvanzar).toHaveBeenLastCalledWith(1)
    })
  })
})
