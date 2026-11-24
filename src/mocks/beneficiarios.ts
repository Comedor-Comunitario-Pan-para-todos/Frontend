import { delay, http, HttpResponse } from 'msw'
import type { Rol } from '@/modules/auth/domain/Usuario.ts'
import {
  esGrupoClasificacion,
  esSistemaClasificacion,
  type ClasificacionSocioeconomica,
} from '@/modules/beneficiarios/domain/clasificacionSocioeconomica.ts'
import type { NivelCaptura } from '@/modules/beneficiarios/domain/nivelCaptura.ts'
import {
  autorizacionTutorEnFicha,
  crearHandlersAutorizacionesTutor,
  reiniciarAutorizacionesTutorMock,
  tieneTutorActivo,
} from './autorizacionesTutor.ts'
import {
  consentimientoVigente,
  crearHandlersConsentimientos,
  reiniciarConsentimientosMock,
  retirarConsentimientoVigente,
  type RegistroConsentimientoMock,
} from './consentimientos.ts'
import { esCargaDePagina, esUuid, texto } from './lecturaDePeticion.ts'
import {
  beneficiarioNoEncontrado,
  camposDesconocidos,
  errorNest,
  idInvalido,
  solicitudInvalida,
} from './respuestasNest.ts'
import { nuevoId } from './nuevoId.ts'

// Simula el módulo `beneficiarios` del backend (NestJS) con un padrón en memoria:
// mismas rutas, mismos nombres de campo y mismos mensajes. Al recargar vuelve al estado inicial.
//
// Diferencias con el backend actual, que siguen el contrato propuesto (docs/BENEFICIARIOS.md):
// * acepta registrar a una persona sin documento (RNF-15);
// * recibe y entrega `nivel` y `clasificacion` (RF-02), y en nivel básico rechaza datos sensibles;
// * guarda el consentimiento informado y la autorización de imagen (RF-19 y RF-20, consentimientos.ts);
// * guarda la autorización del tutor de un menor (RF-21, autorizacionesTutor.ts).

/** Buscar este texto fuerza un error 500, para probar la pantalla de error. */
export const BUSQUEDA_SERVIDOR_CAIDO = 'caida'

interface BeneficiarioMock {
  readonly id: string
  readonly nivel: NivelCaptura
  readonly tipoDocumento: string | null
  readonly numeroDocumento: string | null
  readonly nombres: string
  readonly apellidos: string
  readonly fechaNacimiento: string
  readonly barrio: string | null
  readonly telefono: string | null
  readonly clasificacion: ClasificacionSocioeconomica | null
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

// Algunas personas con todos los datos extendidos, por número de documento.
const EXTENDIDOS_COMPLETOS: Record<string, Pick<BeneficiarioMock, 'telefono' | 'clasificacion'>> = {
  '24891034': { telefono: '3104567812', clasificacion: { sistema: 'RUI', grupo: 'A3' } },
  '24567890': { telefono: '3127788990', clasificacion: { sistema: 'SISBEN_IV', grupo: 'B5' } },
}

const PRIMER_REGISTRO = Date.parse('2026-11-08T17:00:00.000Z')
const UNA_HORA = 3_600_000

// Quienes se registraron antes de RF-19 no tienen consentimiento; la primera persona sí.
function consentimientosSembrados([primera]: BeneficiarioMock[]): RegistroConsentimientoMock[] {
  return [
    {
      id: '00000000-0000-4000-9000-000000000001',
      beneficiarioId: primera.id,
      versionPolitica: 1,
      finalidad: 'ATENCION_ALIMENTARIA',
      registradoPor: { id: 'mock-1', nombreCompleto: 'Coordinación de Prueba' },
      createdAt: primera.createdAt,
      revocadoEn: null,
      revocadoPor: null,
    },
  ]
}

function sembrar(): BeneficiarioMock[] {
  return SEMILLAS.map(([nombres, apellidos, documento, fechaNacimiento, barrio], indice) => {
    const registro = new Date(PRIMER_REGISTRO - indice * UNA_HORA).toISOString()
    const extendidos = (documento && EXTENDIDOS_COMPLETOS[documento[1]]) || null
    return {
      id: `00000000-0000-4000-8000-${String(indice + 1).padStart(12, '0')}`,
      nivel: documento ? 'EXTENDIDO' : 'BASICO',
      tipoDocumento: documento?.[0] ?? null,
      numeroDocumento: documento?.[1] ?? null,
      nombres,
      apellidos,
      fechaNacimiento,
      barrio,
      telefono: extendidos?.telefono ?? null,
      clasificacion: extendidos?.clasificacion ?? null,
      createdAt: registro,
      updatedAt: registro,
      deletedAt: null,
    }
  })
}

let padron = sembrar()
reiniciarConsentimientosMock(consentimientosSembrados(padron))

/** Devuelve el padrón simulado y sus consentimientos al estado inicial. Lo usan las pruebas. */
export function reiniciarBeneficiariosMock(): void {
  padron = sembrar()
  reiniciarConsentimientosMock(consentimientosSembrados(padron))
  reiniciarAutorizacionesTutorMock()
}

/** La ficha que entrega el backend: los datos de la persona y sus autorizaciones vigentes. */
function aFicha(beneficiario: BeneficiarioMock, rol: Rol) {
  return {
    ...beneficiario,
    consentimiento: consentimientoVigente(beneficiario.id, 'ATENCION_ALIMENTARIA'),
    consentimientoImagen: consentimientoVigente(beneficiario.id, 'USO_IMAGEN'),
    autorizacionTutor: autorizacionTutorEnFicha(beneficiario.id, rol),
  }
}

/** Datos de las personas del padrón simulado, en orden de registro. Lo usa el mock de reportes. */
export function personasDelPadronMock() {
  return padron.map(
    ({ nombres, apellidos, tipoDocumento, numeroDocumento, fechaNacimiento, barrio }) => ({
      nombres,
      apellidos,
      tipoDocumento,
      numeroDocumento,
      fechaNacimiento,
      barrio,
    }),
  )
}

const ROLES_PERMITIDOS: readonly Rol[] = ['COORDINADORA', 'VOLUNTARIO']
const CAMPOS_BASICOS = ['nivel', 'nombres', 'apellidos', 'fechaNacimiento', 'barrio']
const CAMPOS_EXTENDIDOS = ['tipoDocumento', 'numeroDocumento', 'telefono', 'clasificacion']
const PARAMETROS_DE_BUSQUEDA = ['search', 'page', 'limit', 'barrio']
const FECHA_CALENDARIO = /^\d{4}-\d{2}-\d{2}$/
const LIMITE_POR_DEFECTO = 10
const LIMITE_MAXIMO = 100

/** Igual que la comparación de MySQL: sin distinguir mayúsculas ni tildes. */
function comparable(texto: string): string {
  return texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
}

function entero(valor: string | null, porDefecto: number): number {
  return valor === null ? porDefecto : Number(valor)
}

function validarClasificacion(valor: unknown): string[] {
  if (valor === undefined || valor === null) return []
  const { sistema, grupo } = valor as Record<string, unknown>
  const errores: string[] = []
  if (!esSistemaClasificacion(texto(sistema))) {
    errores.push('El sistema de clasificación debe ser RUI o SISBEN_IV')
  }
  if (!esGrupoClasificacion(texto(grupo))) {
    errores.push('El grupo de clasificación debe estar entre A1 y D21')
  }
  return errores
}

function aClasificacion(valor: unknown): ClasificacionSocioeconomica | null {
  if (valor === undefined || valor === null) return null
  const { sistema, grupo } = valor as Record<string, unknown>
  return { sistema: texto(sistema) as ClasificacionSocioeconomica['sistema'], grupo: texto(grupo) }
}

function validarCamposPermitidos(cuerpo: Record<string, unknown>, nivel: NivelCaptura): string[] {
  const permitidos = nivel === 'BASICO' ? CAMPOS_BASICOS : [...CAMPOS_BASICOS, ...CAMPOS_EXTENDIDOS]

  return Object.keys(cuerpo)
    .filter((campo) => !permitidos.includes(campo))
    .map((campo) =>
      CAMPOS_EXTENDIDOS.includes(campo)
        ? `property ${campo} should not exist in nivel BASICO`
        : `property ${campo} should not exist`,
    )
}

function validarBasicos(cuerpo: Record<string, unknown>): string[] {
  const errores: string[] = []
  if (texto(cuerpo.nombres) === '') errores.push('Los nombres son requeridos')
  if (texto(cuerpo.apellidos) === '') errores.push('Los apellidos son requeridos')
  if (!FECHA_CALENDARIO.test(texto(cuerpo.fechaNacimiento))) {
    errores.push('La fecha de nacimiento debe tener formato válido AAAA-MM-DD')
  }
  return errores
}

function validarExtendidos(cuerpo: Record<string, unknown>): string[] {
  const errores: string[] = []
  const tieneTipo = texto(cuerpo.tipoDocumento) !== ''
  const tieneNumero = texto(cuerpo.numeroDocumento) !== ''
  if (tieneNumero && !tieneTipo) errores.push('El tipo de documento es requerido')
  if (tieneTipo && !tieneNumero) errores.push('El número de documento es requerido')
  return [...errores, ...validarClasificacion(cuerpo.clasificacion)]
}

function validarRegistro(cuerpo: Record<string, unknown>): string[] {
  const nivel = cuerpo.nivel
  if (nivel !== 'BASICO' && nivel !== 'EXTENDIDO') {
    return ['El nivel debe ser BASICO o EXTENDIDO']
  }

  const desconocidos = validarCamposPermitidos(cuerpo, nivel)
  const basicos = validarBasicos(cuerpo)
  const extendidos = nivel === 'EXTENDIDO' ? validarExtendidos(cuerpo) : []

  return [...desconocidos, ...extendidos, ...basicos]
}

function validarCompletado(cuerpo: Record<string, unknown>): string[] {
  if (cuerpo.nivel !== 'EXTENDIDO') return ['El nivel debe ser EXTENDIDO']
  const desconocidos = camposDesconocidos(cuerpo, ['nivel', ...CAMPOS_EXTENDIDOS])
  return [...desconocidos, ...validarExtendidos(cuerpo)]
}

function tieneCamposExtendidos(cuerpo: Record<string, unknown>): boolean {
  return Object.keys(cuerpo).some((campo) => CAMPOS_EXTENDIDOS.includes(campo))
}

function validarActualizacion(cuerpo: Record<string, unknown>, nivel: NivelCaptura): string[] {
  const desconocidos = validarCamposPermitidos(cuerpo, nivel)
  const extendidos = nivel === 'EXTENDIDO' ? validarExtendidos(cuerpo) : []
  return [...desconocidos, ...extendidos, ...validarBasicos(cuerpo)]
}

function actualizar(actual: BeneficiarioMock, cuerpo: Record<string, unknown>): BeneficiarioMock {
  const basicos = {
    ...actual,
    nombres: texto(cuerpo.nombres),
    apellidos: texto(cuerpo.apellidos),
    fechaNacimiento: texto(cuerpo.fechaNacimiento),
    barrio: texto(cuerpo.barrio) || null,
    updatedAt: new Date().toISOString(),
  }
  if (!tieneCamposExtendidos(cuerpo)) return basicos

  const numeroDocumento = texto(cuerpo.numeroDocumento) || null
  return {
    ...basicos,
    tipoDocumento: numeroDocumento ? texto(cuerpo.tipoDocumento).toUpperCase() : null,
    numeroDocumento,
    telefono: texto(cuerpo.telefono) || null,
    clasificacion: aClasificacion(cuerpo.clasificacion),
  }
}

function documentoRepetido(numeroDocumento: string | null, id?: string) {
  if (!numeroDocumento) return null
  if (!padron.some((b) => b.numeroDocumento === numeroDocumento && b.id !== id)) return null
  return errorNest(
    409,
    `Ya existe un beneficiario registrado con el número de documento ${numeroDocumento}`,
    'Conflict',
  )
}

interface UsuarioIdentificado {
  readonly id: string
  readonly nombreCompleto: string
  readonly rol: Rol
}

type Identificar = (autorizacion: string | null) => UsuarioIdentificado | undefined

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

  function usuarioDe(request: Request) {
    return identificar(request.headers.get('Authorization'))!
  }

  function rolDe(request: Request): Rol {
    return usuarioDe(request).rol
  }

  const buscarBeneficiario = (id: string) => padron.find((b) => b.id === id)

  /** Actualización de datos (Ley 1581): los datos sensibles solo los cambia la Coordinadora. */
  function actualizarDatos(
    request: Request,
    actual: BeneficiarioMock,
    cuerpo: Record<string, unknown>,
  ) {
    if (tieneCamposExtendidos(cuerpo) && rolDe(request) !== 'COORDINADORA') {
      return errorNest(403, 'Forbidden resource', 'Forbidden')
    }
    const errores = validarActualizacion(cuerpo, actual.nivel)
    if (errores.length > 0) return solicitudInvalida(errores)

    const repetido = documentoRepetido(texto(cuerpo.numeroDocumento) || null, actual.id)
    if (repetido) return repetido

    const actualizado = actualizar(actual, cuerpo)
    padron = padron.map((b) => (b.id === actual.id ? actualizado : b))
    return HttpResponse.json(aFicha(actualizado, rolDe(request)))
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
      const repetido = documentoRepetido(numeroDocumento)
      if (repetido) return repetido

      const ahora = new Date().toISOString()
      const nuevo: BeneficiarioMock = {
        id: nuevoId(),
        nivel: cuerpo.nivel as NivelCaptura,
        tipoDocumento: numeroDocumento ? texto(cuerpo.tipoDocumento).toUpperCase() : null,
        numeroDocumento,
        nombres: texto(cuerpo.nombres),
        apellidos: texto(cuerpo.apellidos),
        fechaNacimiento: texto(cuerpo.fechaNacimiento),
        barrio: texto(cuerpo.barrio) || null,
        telefono: texto(cuerpo.telefono) || null,
        clasificacion: aClasificacion(cuerpo.clasificacion),
        createdAt: ahora,
        updatedAt: ahora,
        deletedAt: null,
      }
      padron = [nuevo, ...padron]

      return HttpResponse.json(aFicha(nuevo, rolDe(request)), { status: 201 })
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
        data: encontrados
          .slice((page - 1) * limit, page * limit)
          .map((b) => aFicha(b, rolDe(request))),
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

      return HttpResponse.json({
        existe: beneficiario !== null,
        beneficiario: beneficiario && aFicha(beneficiario, rolDe(request)),
      })
    }),

    http.get('*/beneficiarios/:id', async ({ request, params }) => {
      if (esCargaDePagina(request)) return undefined
      await delay()
      const rechazo = rechazoDeAcceso(request)
      if (rechazo) return rechazo

      const id = String(params.id)
      if (!esUuid(id)) return idInvalido()

      const beneficiario = padron.find((b) => b.id === id)
      return beneficiario
        ? HttpResponse.json(aFicha(beneficiario, rolDe(request)))
        : beneficiarioNoEncontrado(id)
    }),

    http.patch('*/beneficiarios/:id', async ({ request, params }) => {
      await delay()
      const rechazo = rechazoDeAcceso(request)
      if (rechazo) return rechazo

      const id = String(params.id)
      if (!esUuid(id)) return idInvalido()
      const actual = padron.find((b) => b.id === id)
      if (!actual) return beneficiarioNoEncontrado(id)

      const cuerpo = (await request.json()) as Record<string, unknown>
      if (!('nivel' in cuerpo)) return actualizarDatos(request, actual, cuerpo)

      const errores = validarCompletado(cuerpo)
      if (errores.length > 0) return solicitudInvalida(errores)

      const numeroDocumento = texto(cuerpo.numeroDocumento) || null
      const repetido = documentoRepetido(numeroDocumento, id)
      if (repetido) return repetido

      const completado: BeneficiarioMock = {
        ...actual,
        nivel: 'EXTENDIDO',
        tipoDocumento: numeroDocumento ? texto(cuerpo.tipoDocumento).toUpperCase() : null,
        numeroDocumento,
        telefono: texto(cuerpo.telefono) || null,
        clasificacion: aClasificacion(cuerpo.clasificacion),
        updatedAt: new Date().toISOString(),
      }
      padron = padron.map((b) => (b.id === id ? completado : b))

      return HttpResponse.json(aFicha(completado, rolDe(request)))
    }),

    ...crearHandlersConsentimientos({
      rechazoDeAcceso,
      usuarioDe: (request) => {
        const { id, nombreCompleto } = usuarioDe(request)
        return { id, nombreCompleto }
      },
      rolDe,
      buscarBeneficiario,
      tieneTutorActivo,
    }),

    ...crearHandlersAutorizacionesTutor({
      rechazoDeAcceso,
      usuarioDe: (request) => {
        const { id, nombreCompleto } = usuarioDe(request)
        return { id, nombreCompleto }
      },
      rolDe,
      buscarBeneficiario,
      retirarImagenVigente: (idBeneficiario, usuario) =>
        retirarConsentimientoVigente(idBeneficiario, 'USO_IMAGEN', usuario),
    }),
  ]
}
