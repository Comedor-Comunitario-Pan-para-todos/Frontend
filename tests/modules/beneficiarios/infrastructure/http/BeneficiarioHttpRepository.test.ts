import { http, HttpResponse } from 'msw'
import { describe, expect, it, vi } from 'vitest'
import { BeneficiarioDuplicado } from '@/modules/beneficiarios/domain/BeneficiarioDuplicado.ts'
import type { NuevoBeneficiario } from '@/modules/beneficiarios/domain/Beneficiario.ts'
import { BeneficiarioHttpRepository } from '@/modules/beneficiarios/infrastructure/http/BeneficiarioHttpRepository.ts'
import { AxiosHttpClient } from '@/shared/infrastructure/http/AxiosHttpClient.ts'
import { servidor } from '../../../../mocks/servidor.ts'
import { CARLOS, MARIA } from '../../datosDePrueba.ts'

// Así responde el backend (entidad de TypeORM serializada por NestJS).
const DTO_MARIA = {
  id: MARIA.id,
  tipoDocumento: 'CC',
  numeroDocumento: '42185390',
  nombres: 'María Elena',
  apellidos: 'Restrepo',
  fechaNacimiento: '1958-03-15',
  barrio: 'El Poblado',
  telefono: null,
  createdAt: MARIA.registradoEn,
  updatedAt: '2026-11-03T10:00:00.000Z',
  deletedAt: null,
}

const DTO_CARLOS = {
  id: CARLOS.id,
  tipoDocumento: null,
  numeroDocumento: null,
  nombres: 'Carlos Julio',
  apellidos: 'Morales Restrepo',
  fechaNacimiento: '2014-03-15',
  barrio: null,
  telefono: null,
  createdAt: CARLOS.registradoEn,
  updatedAt: CARLOS.registradoEn,
  deletedAt: null,
}

const NUEVA: NuevoBeneficiario = {
  nombres: 'María Elena',
  apellidos: 'Restrepo',
  documento: { tipo: 'CC', numero: '42185390' },
  fechaNacimiento: '1958-03-15',
  barrio: 'El Poblado',
}

function crearRepositorio() {
  return new BeneficiarioHttpRepository(
    new AxiosHttpClient({
      baseUrl: '/api',
      sesion: { obtenerToken: () => 'jwt', alExpirarSesion: vi.fn() },
    }),
  )
}

function errorNest(estado: number, mensaje: string | string[]) {
  return HttpResponse.json({ statusCode: estado, message: mensaje }, { status: estado })
}

describe('BeneficiarioHttpRepository', () => {
  describe('registrar', () => {
    it('envía los datos con los nombres de campo del backend y devuelve la ficha', async () => {
      let cuerpo: unknown
      servidor.use(
        http.post('*/api/beneficiarios', async ({ request }) => {
          cuerpo = await request.json()
          return HttpResponse.json(DTO_MARIA, { status: 201 })
        }),
      )

      const ficha = await crearRepositorio().registrar(NUEVA)

      expect(cuerpo).toEqual({
        tipoDocumento: 'CC',
        numeroDocumento: '42185390',
        nombres: 'María Elena',
        apellidos: 'Restrepo',
        fechaNacimiento: '1958-03-15',
        barrio: 'El Poblado',
      })
      expect(ficha).toEqual(MARIA)
    })

    it('sin documento ni barrio no envía esos campos', async () => {
      let cuerpo: unknown
      servidor.use(
        http.post('*/api/beneficiarios', async ({ request }) => {
          cuerpo = await request.json()
          return HttpResponse.json(DTO_CARLOS, { status: 201 })
        }),
      )

      const ficha = await crearRepositorio().registrar({
        nombres: 'Carlos Julio',
        apellidos: 'Morales Restrepo',
        documento: null,
        fechaNacimiento: '2014-03-15',
        barrio: null,
      })

      expect(cuerpo).toEqual({
        nombres: 'Carlos Julio',
        apellidos: 'Morales Restrepo',
        fechaNacimiento: '2014-03-15',
      })
      expect(ficha).toEqual(CARLOS)
    })

    it('envía el token de la sesión', async () => {
      let autorizacion: string | null = null
      servidor.use(
        http.post('*/api/beneficiarios', ({ request }) => {
          autorizacion = request.headers.get('Authorization')
          return HttpResponse.json(DTO_MARIA, { status: 201 })
        }),
      )

      await crearRepositorio().registrar(NUEVA)

      expect(autorizacion).toBe('Bearer jwt')
    })

    it('un 409 se convierte en BeneficiarioDuplicado con el documento repetido', async () => {
      servidor.use(
        http.post('*/api/beneficiarios', () =>
          errorNest(
            409,
            'Ya existe un beneficiario registrado con el número de documento 42185390',
          ),
        ),
      )

      const error = await crearRepositorio()
        .registrar(NUEVA)
        .catch((capturado: unknown) => capturado)

      expect(error).toBeInstanceOf(BeneficiarioDuplicado)
      expect(error).toMatchObject({ numeroDocumento: '42185390' })
      expect((error as BeneficiarioDuplicado).cause).toMatchObject({ tipo: 'conflicto' })
    })

    it('un rechazo de validación llega con los mensajes del servidor', async () => {
      servidor.use(
        http.post('*/api/beneficiarios', () =>
          errorNest(400, ['El tipo de documento es requerido']),
        ),
      )

      await expect(
        crearRepositorio().registrar({ ...NUEVA, documento: null }),
      ).rejects.toMatchObject({
        tipo: 'validacion',
        mensajesServidor: ['El tipo de documento es requerido'],
      })
    })
  })

  describe('buscar', () => {
    it('traduce los criterios a search, page y limit', async () => {
      let consulta = new URLSearchParams()
      servidor.use(
        http.get('*/api/beneficiarios', ({ request }) => {
          consulta = new URL(request.url).searchParams
          return HttpResponse.json({
            data: [DTO_MARIA, DTO_CARLOS],
            meta: { total: 41, page: 2, limit: 20, totalPages: 3 },
          })
        }),
      )

      const pagina = await crearRepositorio().buscar({
        texto: 'Restrepo',
        pagina: 2,
        porPagina: 20,
      })

      expect(Object.fromEntries(consulta)).toEqual({ search: 'Restrepo', page: '2', limit: '20' })
      expect(pagina).toEqual({
        beneficiarios: [MARIA, CARLOS],
        total: 41,
        pagina: 2,
        totalPaginas: 3,
      })
    })

    it('sin texto no envía el parámetro search', async () => {
      let consulta = new URLSearchParams()
      servidor.use(
        http.get('*/api/beneficiarios', ({ request }) => {
          consulta = new URL(request.url).searchParams
          return HttpResponse.json({
            data: [],
            meta: { total: 0, page: 1, limit: 20, totalPages: 0 },
          })
        }),
      )

      const pagina = await crearRepositorio().buscar({ texto: '', pagina: 1, porPagina: 20 })

      expect(consulta.has('search')).toBe(false)
      expect(pagina.beneficiarios).toEqual([])
    })

    it('se puede cancelar', async () => {
      servidor.use(http.get('*/api/beneficiarios', () => new Promise<never>(() => {})))
      const control = new AbortController()

      const consulta = crearRepositorio().buscar(
        { texto: 'María', pagina: 1, porPagina: 20 },
        control.signal,
      )
      control.abort()

      await expect(consulta).rejects.toMatchObject({ tipo: 'cancelada' })
    })

    it('una respuesta con otra forma es una respuesta inválida', async () => {
      servidor.use(http.get('*/api/beneficiarios', () => HttpResponse.json([DTO_MARIA])))

      await expect(
        crearRepositorio().buscar({ texto: '', pagina: 1, porPagina: 20 }),
      ).rejects.toMatchObject({ tipo: 'respuesta-invalida' })
    })
  })

  describe('consultarPorId', () => {
    it('devuelve la ficha y descarta los campos que no usa', async () => {
      servidor.use(http.get(`*/api/beneficiarios/${MARIA.id}`, () => HttpResponse.json(DTO_MARIA)))

      await expect(crearRepositorio().consultarPorId(MARIA.id)).resolves.toEqual(MARIA)
    })

    it('conserva solo el día si la fecha de nacimiento llega con hora', async () => {
      servidor.use(
        http.get(`*/api/beneficiarios/${MARIA.id}`, () =>
          HttpResponse.json({ ...DTO_MARIA, fechaNacimiento: '1958-03-15T00:00:00.000Z' }),
        ),
      )

      const ficha = await crearRepositorio().consultarPorId(MARIA.id)

      expect(ficha.fechaNacimiento).toBe('1958-03-15')
    })

    it('acepta un tipo de documento que la app no conoce', async () => {
      servidor.use(
        http.get(`*/api/beneficiarios/${MARIA.id}`, () =>
          HttpResponse.json({ ...DTO_MARIA, tipoDocumento: 'CE' }),
        ),
      )

      const ficha = await crearRepositorio().consultarPorId(MARIA.id)

      expect(ficha.documento).toEqual({ tipo: 'CE', numero: '42185390' })
    })

    it('si no existe responde no-encontrado', async () => {
      servidor.use(
        http.get(`*/api/beneficiarios/${MARIA.id}`, () =>
          errorNest(404, `Beneficiario con ID ${MARIA.id} no encontrado`),
        ),
      )

      await expect(crearRepositorio().consultarPorId(MARIA.id)).rejects.toMatchObject({
        tipo: 'no-encontrado',
      })
    })

    it('una ficha sin fecha de nacimiento es una respuesta inválida', async () => {
      servidor.use(
        http.get(`*/api/beneficiarios/${MARIA.id}`, () =>
          HttpResponse.json({ ...DTO_MARIA, fechaNacimiento: null }),
        ),
      )

      await expect(crearRepositorio().consultarPorId(MARIA.id)).rejects.toMatchObject({
        tipo: 'respuesta-invalida',
      })
    })
  })

  describe('buscarPorDocumento', () => {
    it('devuelve a quien tiene ese documento', async () => {
      servidor.use(
        http.get('*/api/beneficiarios/validar-documento/42185390', () =>
          HttpResponse.json({ existe: true, beneficiario: DTO_MARIA }),
        ),
      )

      await expect(crearRepositorio().buscarPorDocumento('42185390')).resolves.toEqual(MARIA)
    })

    it('devuelve null si nadie lo tiene', async () => {
      servidor.use(
        http.get('*/api/beneficiarios/validar-documento/1088234567', () =>
          HttpResponse.json({ existe: false, beneficiario: null }),
        ),
      )

      await expect(crearRepositorio().buscarPorDocumento('1088234567')).resolves.toBeNull()
    })

    it('codifica el número para que no cambie la ruta', async () => {
      let ruta = ''
      servidor.use(
        http.get('*/api/beneficiarios/validar-documento/:numero', ({ request }) => {
          ruta = new URL(request.url).pathname
          return HttpResponse.json({ existe: false, beneficiario: null })
        }),
      )

      await crearRepositorio().buscarPorDocumento('AB/12 3')

      expect(ruta).toBe('/api/beneficiarios/validar-documento/AB%2F12%203')
    })
  })
})
