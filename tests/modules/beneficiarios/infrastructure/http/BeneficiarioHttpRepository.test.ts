import { http, HttpResponse, type JsonBodyType } from 'msw'
import { describe, expect, it, vi } from 'vitest'
import { BeneficiarioDuplicado } from '@/modules/beneficiarios/domain/BeneficiarioDuplicado.ts'
import type { NuevoBeneficiarioExtendido } from '@/modules/beneficiarios/domain/NuevoBeneficiario.ts'
import { BeneficiarioHttpRepository } from '@/modules/beneficiarios/infrastructure/http/BeneficiarioHttpRepository.ts'
import { AxiosHttpClient } from '@/shared/infrastructure/http/AxiosHttpClient.ts'
import { servidor } from '../../../../mocks/servidor.ts'
import { MARIA } from '../../datosDePrueba.ts'
import { DTO_MARIA } from './dtosDePrueba.ts'

const NUEVA: NuevoBeneficiarioExtendido = {
  nivel: 'EXTENDIDO',
  nombres: 'María Elena',
  apellidos: 'Restrepo',
  documento: { tipo: 'CC', numero: '42185390' },
  fechaNacimiento: '1958-03-15',
  barrio: 'El Poblado',
  telefono: null,
  clasificacion: null,
}

const repositorio = new BeneficiarioHttpRepository(
  new AxiosHttpClient({
    baseUrl: '/api',
    sesion: { obtenerToken: () => 'jwt', alExpirarSesion: vi.fn() },
  }),
)

/** Responde a cualquier petición con `respuesta` y guarda la última que llegó. */
function responder(respuesta: JsonBodyType, estado = 200) {
  const recibida: { metodo?: string; url?: URL; cuerpo?: unknown } = {}
  servidor.use(
    http.all('*/api/beneficiarios*', async ({ request }) => {
      recibida.metodo = request.method
      recibida.url = new URL(request.url)
      recibida.cuerpo = request.method === 'GET' ? undefined : await request.json()
      return HttpResponse.json(respuesta, { status: estado })
    }),
  )
  return recibida
}

describe('BeneficiarioHttpRepository', () => {
  it('registrar envía POST /beneficiarios y devuelve la ficha', async () => {
    const recibida = responder(DTO_MARIA, 201)

    const ficha = await repositorio.registrar(NUEVA)

    expect(recibida.metodo).toBe('POST')
    expect(recibida.url?.pathname).toBe('/api/beneficiarios')
    expect(recibida.cuerpo).toMatchObject({ nivel: 'EXTENDIDO', numeroDocumento: '42185390' })
    expect(ficha).toEqual(MARIA)
  })

  it('un 409 al registrar se convierte en BeneficiarioDuplicado con el documento', async () => {
    responder({ statusCode: 409, message: 'Ya existe' }, 409)

    const error = await repositorio.registrar(NUEVA).catch((capturado: unknown) => capturado)

    expect(error).toBeInstanceOf(BeneficiarioDuplicado)
    expect(error).toMatchObject({ numeroDocumento: '42185390', cause: { tipo: 'conflicto' } })
  })

  it('completarDatosExtendidos envía PATCH /beneficiarios/:id', async () => {
    const recibida = responder(DTO_MARIA)

    await repositorio.completarDatosExtendidos(MARIA.id, NUEVA)

    expect(recibida.metodo).toBe('PATCH')
    expect(recibida.url?.pathname).toBe(`/api/beneficiarios/${MARIA.id}`)
    expect(recibida.cuerpo).toEqual({
      nivel: 'EXTENDIDO',
      tipoDocumento: 'CC',
      numeroDocumento: '42185390',
    })
  })

  it('un 409 al completar se convierte en BeneficiarioDuplicado', async () => {
    responder({ statusCode: 409, message: 'Ya existe' }, 409)

    const error = await repositorio
      .completarDatosExtendidos(MARIA.id, NUEVA)
      .catch((capturado: unknown) => capturado)

    expect(error).toMatchObject({ numeroDocumento: '42185390' })
    expect(error).toBeInstanceOf(BeneficiarioDuplicado)
  })

  it('buscar envía GET /beneficiarios con los criterios', async () => {
    const recibida = responder({ data: [], meta: { total: 0, page: 1, limit: 20, totalPages: 0 } })

    await repositorio.buscar({ texto: 'Restrepo', pagina: 1, porPagina: 20 })

    expect(recibida.url?.pathname).toBe('/api/beneficiarios')
    expect(Object.fromEntries(recibida.url!.searchParams)).toEqual({
      search: 'Restrepo',
      page: '1',
      limit: '20',
    })
  })

  it('consultarPorId envía GET /beneficiarios/:id', async () => {
    const recibida = responder(DTO_MARIA)

    await expect(repositorio.consultarPorId(MARIA.id)).resolves.toEqual(MARIA)
    expect(recibida.url?.pathname).toBe(`/api/beneficiarios/${MARIA.id}`)
  })

  it('buscarPorDocumento codifica el número para que no cambie la ruta', async () => {
    const recibida = responder({ existe: false, beneficiario: null })

    await expect(repositorio.buscarPorDocumento('AB/12 3')).resolves.toBeNull()
    expect(recibida.url?.pathname).toBe('/api/beneficiarios/validar-documento/AB%2F12%203')
  })
})
