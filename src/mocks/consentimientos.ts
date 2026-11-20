import { delay, http, HttpResponse } from 'msw'
import { esMenorDeEdad } from '@/modules/beneficiarios/domain/edad.ts'
import { fechaDeHoy } from '@/shared/domain/fechaDeHoy.ts'
import { esCargaDePagina, esUuid, texto } from './lecturaDePeticion.ts'
import {
  beneficiarioNoEncontrado,
  camposDesconocidos,
  errorNest,
  idInvalido,
  solicitudInvalida,
} from './respuestasNest.ts'

// Simula los consentimientos del backend (RF-19 y RF-20, docs/CONSENTIMIENTOS.md).
// Un retiro no borra nada: marca cuándo y quién lo retiró, y queda en el historial.

const FINALIDADES = ['ATENCION_ALIMENTARIA', 'USO_IMAGEN']
const FINALIDAD_USO_IMAGEN = 'USO_IMAGEN'
const CAMPOS_REGISTRO = ['versionPolitica', 'finalidad']
const CAMPOS_REVOCACION = ['finalidad']
const PARAMETROS_HISTORIAL = ['finalidad']

interface UsuarioMock {
  readonly id: string
  readonly nombreCompleto: string
}

export interface ConsentimientoMock {
  readonly id: string
  readonly versionPolitica: number
  readonly finalidad: string
  readonly registradoPor: UsuarioMock
  readonly createdAt: string
  readonly revocadoEn: string | null
  readonly revocadoPor: UsuarioMock | null
}

export interface RegistroConsentimientoMock extends ConsentimientoMock {
  readonly beneficiarioId: string
}

let registros: RegistroConsentimientoMock[] = []

export function reiniciarConsentimientosMock(iniciales: RegistroConsentimientoMock[]): void {
  registros = iniciales
}

function sinBeneficiario({
  beneficiarioId: _beneficiarioId,
  ...consentimiento
}: RegistroConsentimientoMock): ConsentimientoMock {
  return consentimiento
}

function vigente(idBeneficiario: string, finalidad: string) {
  return registros.find(
    (r) => r.beneficiarioId === idBeneficiario && r.finalidad === finalidad && !r.revocadoEn,
  )
}

export function consentimientoVigente(
  idBeneficiario: string,
  finalidad: string,
): ConsentimientoMock | null {
  const encontrado = vigente(idBeneficiario, finalidad)
  return encontrado ? sinBeneficiario(encontrado) : null
}

function validarFinalidad(valor: unknown): string[] {
  const finalidad = texto(valor)
  if (finalidad === '') return ['La finalidad es requerida']
  if (!FINALIDADES.includes(finalidad)) {
    return ['La finalidad debe ser ATENCION_ALIMENTARIA o USO_IMAGEN']
  }
  return []
}

function validarRegistro(cuerpo: Record<string, unknown>): string[] {
  const errores: string[] = []
  const version = cuerpo.versionPolitica
  if (typeof version !== 'number' || !Number.isInteger(version) || version < 1) {
    errores.push('La versión de la política debe ser un entero positivo')
  }
  return [
    ...camposDesconocidos(cuerpo, CAMPOS_REGISTRO),
    ...errores,
    ...validarFinalidad(cuerpo.finalidad),
  ]
}

function validarRevocacion(cuerpo: Record<string, unknown>): string[] {
  return [...camposDesconocidos(cuerpo, CAMPOS_REVOCACION), ...validarFinalidad(cuerpo.finalidad)]
}

function menorSinTutor() {
  return errorNest(
    409,
    'El uso de imagen de un menor de edad requiere la autorización de su tutor',
    'Conflict',
  )
}

function sinAutorizacionVigente(finalidad: string) {
  return errorNest(
    404,
    `No hay una autorización vigente con la finalidad ${finalidad}`,
    'Not Found',
  )
}

interface Dependencias {
  /** Responde 401 o 403 como los guards del backend; `null` si el usuario puede continuar. */
  readonly rechazoDeAcceso: (request: Request) => Response | null
  readonly usuarioDe: (request: Request) => UsuarioMock
  readonly buscarBeneficiario: (id: string) => { readonly fechaNacimiento: string } | undefined
}

export function crearHandlersConsentimientos({
  rechazoDeAcceso,
  usuarioDe,
  buscarBeneficiario,
}: Dependencias) {
  /** Lo que revisan todas las rutas antes de empezar: acceso, id válido y que la persona exista. */
  async function beneficiarioDeLaRuta(request: Request, idEnRuta: unknown) {
    await delay()
    const rechazo = rechazoDeAcceso(request)
    if (rechazo) return { rechazo }

    const id = String(idEnRuta)
    if (!esUuid(id)) return { rechazo: idInvalido() }
    const beneficiario = buscarBeneficiario(id)
    if (!beneficiario) return { rechazo: beneficiarioNoEncontrado(id) }
    return { id, beneficiario }
  }

  return [
    http.post('*/beneficiarios/:id/consentimiento', async ({ request, params }) => {
      const ruta = await beneficiarioDeLaRuta(request, params.id)
      if (ruta.rechazo) return ruta.rechazo
      const { id, beneficiario } = ruta

      const cuerpo = (await request.json()) as Record<string, unknown>
      const errores = validarRegistro(cuerpo)
      if (errores.length > 0) return solicitudInvalida(errores)

      const finalidad = texto(cuerpo.finalidad)
      if (
        finalidad === FINALIDAD_USO_IMAGEN &&
        esMenorDeEdad(beneficiario.fechaNacimiento, fechaDeHoy())
      ) {
        return menorSinTutor()
      }

      const versionPolitica = cuerpo.versionPolitica as number
      const existente = vigente(id, finalidad)
      if (existente?.versionPolitica === versionPolitica) {
        return HttpResponse.json(sinBeneficiario(existente))
      }

      const nuevo: RegistroConsentimientoMock = {
        id: crypto.randomUUID(),
        beneficiarioId: id,
        versionPolitica,
        finalidad,
        registradoPor: usuarioDe(request),
        createdAt: new Date().toISOString(),
        revocadoEn: null,
        revocadoPor: null,
      }
      registros = [nuevo, ...registros]

      return HttpResponse.json(sinBeneficiario(nuevo), { status: 201 })
    }),

    http.post('*/beneficiarios/:id/consentimiento/revocacion', async ({ request, params }) => {
      const ruta = await beneficiarioDeLaRuta(request, params.id)
      if (ruta.rechazo) return ruta.rechazo
      const { id } = ruta

      const cuerpo = (await request.json()) as Record<string, unknown>
      const errores = validarRevocacion(cuerpo)
      if (errores.length > 0) return solicitudInvalida(errores)

      const finalidad = texto(cuerpo.finalidad)
      const actual = vigente(id, finalidad)
      if (!actual) return sinAutorizacionVigente(finalidad)

      const revocado: RegistroConsentimientoMock = {
        ...actual,
        revocadoEn: new Date().toISOString(),
        revocadoPor: usuarioDe(request),
      }
      registros = registros.map((r) => (r.id === actual.id ? revocado : r))

      return HttpResponse.json(sinBeneficiario(revocado))
    }),

    http.get('*/beneficiarios/:id/consentimientos', async ({ request, params }) => {
      if (esCargaDePagina(request)) return undefined
      const ruta = await beneficiarioDeLaRuta(request, params.id)
      if (ruta.rechazo) return ruta.rechazo
      const { id } = ruta

      const consulta = new URL(request.url).searchParams
      const desconocidos = [...consulta.keys()].filter((p) => !PARAMETROS_HISTORIAL.includes(p))
      if (desconocidos.length > 0) {
        return solicitudInvalida(desconocidos.map((p) => `property ${p} should not exist`))
      }
      const finalidad = consulta.get('finalidad')
      if (finalidad !== null) {
        const errores = validarFinalidad(finalidad)
        if (errores.length > 0) return solicitudInvalida(errores)
      }

      const historial = registros.filter(
        (r) => r.beneficiarioId === id && (finalidad === null || r.finalidad === finalidad),
      )
      return HttpResponse.json(historial.map(sinBeneficiario))
    }),
  ]
}
