import { delay, http, HttpResponse } from 'msw'
import type { Rol } from '@/modules/auth/domain/Usuario.ts'

// Simula el módulo `beneficiarios` del backend (NestJS) con un padrón en memoria:
// mismas rutas, mismos nombres de campo y mismos mensajes. Al recargar vuelve al estado inicial.
//
// Única diferencia con el backend actual: acepta registrar a una persona sin documento,
// que es lo que piden el SRS (RNF-15) y el diseño. El backend real todavía lo rechaza con 400.

/** Buscar este texto fuerza un error 500, para probar la pantalla de error. */
export const BUSQUEDA_SERVIDOR_CAIDO = 'caida'

interface BeneficiarioMock {
  readonly id: string
  readonly tipoDocumento: string | null
  readonly numeroDocumento: string | null
  readonly nombres: string
  readonly apellidos: string
  readonly fechaNacimiento: string
  readonly barrio: string | null
  readonly telefono: string | null
  readonly createdAt: string
  readonly updatedAt: string
  readonly deletedAt: null
}

type Semilla = readonly [
  nombres: string,
  apellidos: string,
  documento: readonly [tipo: string, numero: string] | null,
  fechaNacimiento: string,
  barrio: string | null,
]

// Personas ficticias. La primera es la registrada más recientemente.
const SEMILLAS: readonly Semilla[] = [
  ['María Elena', 'Restrepo', ['CC', '42185390'], '1958-03-15', 'El Poblado'],
  ['Carlos Julio', 'Morales Restrepo', null, '2014-03-15', 'Villasantana'],
  ['Rosa', 'Martínez de Osorio', ['CC', '24891034'], '1949-07-02', 'El Poblado'],
  ['José Aníbal', 'Ospina Giraldo', ['CC', '10098234'], '1961-11-20', 'El Jardín'],
  ['Luz Dary', 'Cardona Marín', ['CC', '42087561'], '1972-05-09', 'Cuba'],
  ['Yeison Andrés', 'Bedoya López', ['TI', '1088345672'], '2010-08-30', 'El Jardín'],
  ['Ana Sofía', 'Bedoya López', ['RC', '1089765432'], '2019-02-14', 'El Jardín'],
  ['Pedro Pablo', 'Zapata', null, '1955-01-01', null],
  ['Gloria Inés', 'Henao Ríos', ['CC', '24567890'], '1966-09-12', 'Otún'],
  ['Deiby Alexánder', 'Pérez Gómez', ['PPT', '5012345'], '1994-04-22', 'Villasantana'],
  ['Blanca Nubia', 'Giraldo Arias', ['CC', '25123456'], '1953-12-03', 'El Jardín'],
  ['Jhon Fredy', 'Ramírez Castaño', ['CC', '18523147'], '1980-06-17', 'Cuba'],
  ['Marleny', 'Valencia Toro', ['CC', '42001987'], '1969-10-28', 'Otún'],
  ['Santiago', 'Ramírez Valencia', ['TI', '1087654321'], '2012-01-19', 'Cuba'],
  ['Ofelia', 'Londoño de García', ['CC', '24300876'], '1944-08-06', 'El Poblado'],
  ['Luis Eduardo', 'García Londoño', ['CC', '10234567'], '1975-03-25', 'El Poblado'],
  ['Yuliana', 'Marín Ospina', ['CC', '1088012345'], '1996-07-11', 'El Jardín'],
  ['Emanuel', 'Marín Ospina', ['RC', '1090123456'], '2021-05-04', 'El Jardín'],
  ['Carmen Rosa', 'Tabares', null, '1960-02-29', 'Villasantana'],
  ['Wilson', 'Castaño Henao', ['CC', '9876543'], '1987-11-08', 'Otún'],
  ['Daniela', 'Pérez Cardona', ['PPT', '6123987'], '2001-09-30', 'Villasantana'],
  ['Arturo', 'Toro Zapata', ['CC', '4512876'], '1951-04-14', 'Cuba'],
  ['Nancy Milena', 'Arias Bedoya', ['CC', '42155009'], '1983-12-21', 'El Jardín'],
  ['Mateo', 'Arias Bedoya', ['TI', '1086001234'], '2015-06-02', 'El Jardín'],
]

const PRIMER_REGISTRO = Date.parse('2026-11-08T17:00:00.000Z')
const UNA_HORA = 3_600_000

function sembrar(): BeneficiarioMock[] {
  return SEMILLAS.map(([nombres, apellidos, documento, fechaNacimiento, barrio], indice) => {
    const registro = new Date(PRIMER_REGISTRO - indice * UNA_HORA).toISOString()
    return {
      id: `00000000-0000-4000-8000-${String(indice + 1).padStart(12, '0')}`,
      tipoDocumento: documento?.[0] ?? null,
      numeroDocumento: documento?.[1] ?? null,
      nombres,
      apellidos,
      fechaNacimiento,
      barrio,
      telefono: null,
      createdAt: registro,
      updatedAt: registro,
      deletedAt: null,
    }
  })
}

let padron = sembrar()

/** Devuelve el padrón simulado a su estado inicial. Lo usan las pruebas. */
export function reiniciarBeneficiariosMock(): void {
  padron = sembrar()
}

const ROLES_PERMITIDOS: readonly Rol[] = ['COORDINADORA', 'VOLUNTARIO']
const CAMPOS_DE_REGISTRO = [
  'tipoDocumento',
  'numeroDocumento',
  'nombres',
  'apellidos',
  'fechaNacimiento',
  'barrio',
  'telefono',
]
const PARAMETROS_DE_BUSQUEDA = ['search', 'page', 'limit', 'barrio']
const FECHA_CALENDARIO = /^\d{4}-\d{2}-\d{2}$/
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const LIMITE_POR_DEFECTO = 10
const LIMITE_MAXIMO = 100

function errorNest(estado: number, mensaje: string | string[], error: string) {
  return HttpResponse.json({ statusCode: estado, message: mensaje, error }, { status: estado })
}

function solicitudInvalida(mensajes: string | string[]) {
  return errorNest(400, mensajes, 'Bad Request')
}

function noEncontrado(id: string) {
  return errorNest(404, `Beneficiario con ID ${id} no encontrado`, 'Not Found')
}

/** Igual que la comparación de MySQL: sin distinguir mayúsculas ni tildes. */
function comparable(texto: string): string {
  return texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
}

/**
 * La app tiene pantallas en estas mismas direcciones (`/beneficiarios`, `/beneficiarios/:id`).
 * Abrir o recargar una de ellas no es llamar a la API: se deja pasar para que cargue la página.
 */
function esCargaDePagina(request: Request): boolean {
  return request.headers.get('Accept')?.includes('text/html') ?? false
}

function texto(valor: unknown): string {
  return typeof valor === 'string' ? valor.trim() : ''
}

function entero(valor: string | null, porDefecto: number): number {
  return valor === null ? porDefecto : Number(valor)
}

function validarRegistro(cuerpo: Record<string, unknown>): string[] {
  const errores = Object.keys(cuerpo)
    .filter((campo) => !CAMPOS_DE_REGISTRO.includes(campo))
    .map((campo) => `property ${campo} should not exist`)

  const tieneTipo = texto(cuerpo.tipoDocumento) !== ''
  const tieneNumero = texto(cuerpo.numeroDocumento) !== ''
  if (tieneNumero && !tieneTipo) errores.push('El tipo de documento es requerido')
  if (tieneTipo && !tieneNumero) errores.push('El número de documento es requerido')
  if (texto(cuerpo.nombres) === '') errores.push('Los nombres son requeridos')
  if (texto(cuerpo.apellidos) === '') errores.push('Los apellidos son requeridos')
  if (!FECHA_CALENDARIO.test(texto(cuerpo.fechaNacimiento))) {
    errores.push('La fecha de nacimiento debe tener formato válido AAAA-MM-DD')
  }

  return errores
}

type Identificar = (autorizacion: string | null) => { readonly rol: Rol } | undefined

/**
 * `identificar` resuelve el usuario a partir del encabezado `Authorization`. Lo entrega
 * `handlers.ts`, que es quien conoce a los usuarios simulados.
 */
export function crearHandlersBeneficiarios(identificar: Identificar) {
  /** Responde 401 o 403 como los guards del backend; `null` si el usuario puede continuar. */
  function rechazoDeAcceso(request: Request) {
    const usuario = identificar(request.headers.get('Authorization'))
    if (!usuario) return errorNest(401, 'Unauthorized', 'Unauthorized')
    if (!ROLES_PERMITIDOS.includes(usuario.rol)) {
      return errorNest(403, 'Forbidden resource', 'Forbidden')
    }
    return null
  }

  return [
    http.post('*/beneficiarios', async ({ request }) => {
      await delay()
      const rechazo = rechazoDeAcceso(request)
      if (rechazo) return rechazo

      const cuerpo = (await request.json()) as Record<string, unknown>
      const errores = validarRegistro(cuerpo)
      if (errores.length > 0) return solicitudInvalida(errores)

      const numeroDocumento = texto(cuerpo.numeroDocumento) || null
      if (numeroDocumento && padron.some((b) => b.numeroDocumento === numeroDocumento)) {
        return errorNest(
          409,
          `Ya existe un beneficiario registrado con el número de documento ${numeroDocumento}`,
          'Conflict',
        )
      }

      const ahora = new Date().toISOString()
      const nuevo: BeneficiarioMock = {
        id: crypto.randomUUID(),
        tipoDocumento: numeroDocumento ? texto(cuerpo.tipoDocumento).toUpperCase() : null,
        numeroDocumento,
        nombres: texto(cuerpo.nombres),
        apellidos: texto(cuerpo.apellidos),
        fechaNacimiento: texto(cuerpo.fechaNacimiento),
        barrio: texto(cuerpo.barrio) || null,
        telefono: texto(cuerpo.telefono) || null,
        createdAt: ahora,
        updatedAt: ahora,
        deletedAt: null,
      }
      padron = [nuevo, ...padron]

      return HttpResponse.json(nuevo, { status: 201 })
    }),

    http.get('*/beneficiarios', async ({ request }) => {
      if (esCargaDePagina(request)) return undefined
      await delay()
      const rechazo = rechazoDeAcceso(request)
      if (rechazo) return rechazo

      const consulta = new URL(request.url).searchParams
      const desconocidos = [...consulta.keys()].filter((p) => !PARAMETROS_DE_BUSQUEDA.includes(p))
      if (desconocidos.length > 0) {
        return solicitudInvalida(desconocidos.map((p) => `property ${p} should not exist`))
      }

      const page = entero(consulta.get('page'), 1)
      const limit = entero(consulta.get('limit'), LIMITE_POR_DEFECTO)
      if (!Number.isInteger(page) || page < 1) {
        return solicitudInvalida(['page must not be less than 1'])
      }
      if (!Number.isInteger(limit) || limit < 1 || limit > LIMITE_MAXIMO) {
        return solicitudInvalida([`limit must be between 1 and ${LIMITE_MAXIMO}`])
      }

      const search = comparable(consulta.get('search') ?? '')
      if (search === BUSQUEDA_SERVIDOR_CAIDO) {
        return errorNest(500, 'Internal server error', 'Internal Server Error')
      }

      const barrio = consulta.get('barrio')
      const encontrados = padron.filter(
        (b) =>
          (search === '' ||
            (b.numeroDocumento ?? '').includes(search) ||
            comparable(b.nombres).includes(search) ||
            comparable(b.apellidos).includes(search)) &&
          (!barrio || b.barrio === barrio),
      )

      return HttpResponse.json({
        data: encontrados.slice((page - 1) * limit, page * limit),
        meta: {
          total: encontrados.length,
          page,
          limit,
          totalPages: Math.ceil(encontrados.length / limit),
        },
      })
    }),

    http.get('*/beneficiarios/validar-documento/:numero', async ({ request, params }) => {
      if (esCargaDePagina(request)) return undefined
      await delay()
      const rechazo = rechazoDeAcceso(request)
      if (rechazo) return rechazo

      const numero = String(params.numero).trim()
      const beneficiario = padron.find((b) => b.numeroDocumento === numero) ?? null

      return HttpResponse.json({ existe: beneficiario !== null, beneficiario })
    }),

    http.get('*/beneficiarios/:id', async ({ request, params }) => {
      if (esCargaDePagina(request)) return undefined
      await delay()
      const rechazo = rechazoDeAcceso(request)
      if (rechazo) return rechazo

      const id = String(params.id)
      if (!UUID.test(id)) return solicitudInvalida('Validation failed (uuid is expected)')

      const beneficiario = padron.find((b) => b.id === id)
      return beneficiario ? HttpResponse.json(beneficiario) : noEncontrado(id)
    }),
  ]
}
