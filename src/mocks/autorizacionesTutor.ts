import { delay, http, HttpResponse } from 'msw'
import type { Rol } from '@/modules/auth/domain/Usuario.ts'
import { TIPOS_DOCUMENTO_TUTOR } from '@/modules/beneficiarios/domain/documento.ts'
import { esMenorDeEdad } from '@/modules/beneficiarios/domain/edad.ts'
import { PARENTESCOS } from '@/modules/beneficiarios/domain/parentesco.ts'
import {
  FORMATOS_SOPORTE,
  TAMANO_MAXIMO_SOPORTE,
} from '@/modules/beneficiarios/domain/soporteAutorizacion.ts'
import { fechaDeHoy } from '@/shared/domain/fechaDeHoy.ts'
import { esUuid, leerFormulario, texto } from './lecturaDePeticion.ts'
import {
  beneficiarioNoEncontrado,
  camposDesconocidos,
  errorNest,
  idInvalido,
  solicitudInvalida,
} from './respuestasNest.ts'

// Simula la autorización del tutor de un menor (RF-21, docs/CONSENTIMIENTOS.md sección 6).
// Revocar no borra: marca cuándo, quién y por qué.

const CAMPOS_REGISTRO = [
  'nombre',
  'tipoDocumento',
  'numeroDocumento',
  'parentesco',
  'telefono',
  'soporte',
]

interface UsuarioMock {
  readonly id: string
  readonly nombreCompleto: string
}

interface AutorizacionTutorMock {
  readonly id: string
  readonly beneficiarioId: string
  readonly estado: 'ACTIVA' | 'REVOCADA'
  readonly tutor: {
    readonly nombre: string
    readonly tipoDocumento: string
    readonly numeroDocumento: string
    readonly parentesco: string
    readonly telefono: string
  }
  readonly soporte: File
  readonly aprobadaPor: UsuarioMock
  readonly fechaAprobacion: string
  readonly revocadaEn: string | null
  readonly revocadaPor: UsuarioMock | null
  readonly motivoRevocacion: string | null
}

let autorizaciones: AutorizacionTutorMock[] = []

export function reiniciarAutorizacionesTutorMock(): void {
  autorizaciones = []
}

function activa(idBeneficiario: string) {
  return autorizaciones.find((a) => a.beneficiarioId === idBeneficiario && a.estado === 'ACTIVA')
}

export function tieneTutorActivo(idBeneficiario: string): boolean {
  return activa(idBeneficiario) !== undefined
}

/** Lo que entrega el backend: sin el archivo, y sin documento ni teléfono para quien no coordina. */
function aRespuesta(
  { beneficiarioId: _beneficiarioId, soporte: _soporte, ...autorizacion }: AutorizacionTutorMock,
  rol: Rol,
) {
  if (rol === 'COORDINADORA') return autorizacion
  return {
    ...autorizacion,
    tutor: { ...autorizacion.tutor, tipoDocumento: null, numeroDocumento: null, telefono: null },
  }
}

/** La autorización activa del menor tal como la ve ese rol, o `null`. */
export function autorizacionTutorEnFicha(idBeneficiario: string, rol: Rol) {
  const encontrada = activa(idBeneficiario)
  return encontrada ? aRespuesta(encontrada, rol) : null
}

function validarTexto(valor: unknown, campo: string, maximo: number): string[] {
  const limpio = texto(valor)
  if (limpio === '') return [`El campo ${campo} es requerido`]
  if (limpio.length > maximo) return [`El campo ${campo} no puede superar ${maximo} caracteres`]
  return []
}

function validarOpcion(valor: unknown, campo: string, opciones: readonly string[]): string[] {
  return opciones.includes(texto(valor))
    ? []
    : [`El campo ${campo} debe ser ${opciones.join(', ')}`]
}

function validarSoporte(soporte: FormDataEntryValue | null): string[] {
  if (!(soporte instanceof File)) return ['El soporte firmado es requerido']
  if (!(FORMATOS_SOPORTE as readonly string[]).includes(soporte.type)) {
    return ['El soporte debe ser PDF, JPG o PNG']
  }
  return []
}

function validarRegistro(formulario: FormData): string[] {
  const campos = Object.fromEntries([...formulario.keys()].map((campo) => [campo, true]))
  return [
    ...camposDesconocidos(campos, CAMPOS_REGISTRO),
    ...validarTexto(formulario.get('nombre'), 'nombre', 150),
    ...validarOpcion(formulario.get('tipoDocumento'), 'tipoDocumento', TIPOS_DOCUMENTO_TUTOR),
    ...validarTexto(formulario.get('numeroDocumento'), 'numeroDocumento', 30),
    ...validarOpcion(formulario.get('parentesco'), 'parentesco', PARENTESCOS),
    ...validarTexto(formulario.get('telefono'), 'telefono', 20),
    ...validarSoporte(formulario.get('soporte')),
  ]
}

function validarRevocacion(cuerpo: Record<string, unknown>): string[] {
  return [...camposDesconocidos(cuerpo, ['motivo']), ...validarTexto(cuerpo.motivo, 'motivo', 255)]
}

function soloCoordinadora() {
  return errorNest(
    403,
    'Solo la Coordinadora puede gestionar la autorización del tutor',
    'Forbidden',
  )
}

interface Dependencias {
  /** Responde 401 o 403 como los guards del backend; `null` si el usuario puede continuar. */
  readonly rechazoDeAcceso: (request: Request) => Response | null
  readonly usuarioDe: (request: Request) => UsuarioMock & { readonly rol: Rol }
  readonly buscarBeneficiario: (id: string) => { readonly fechaNacimiento: string } | undefined
  /** Retira la autorización de imagen vigente del menor, anotada por quien revoca al tutor. */
  readonly retirarImagenVigente: (idBeneficiario: string, usuario: UsuarioMock) => void
}

export function crearHandlersAutorizacionesTutor({
  rechazoDeAcceso,
  usuarioDe,
  buscarBeneficiario,
  retirarImagenVigente,
}: Dependencias) {
  /** Acceso, rol de Coordinadora, id válido y que la persona exista. */
  async function menorDeLaRuta(request: Request, idEnRuta: unknown) {
    await delay()
    const rechazo = rechazoDeAcceso(request)
    if (rechazo) return { rechazo }
    const { rol, ...usuario } = usuarioDe(request)
    if (rol !== 'COORDINADORA') return { rechazo: soloCoordinadora() }

    const id = String(idEnRuta)
    if (!esUuid(id)) return { rechazo: idInvalido() }
    const beneficiario = buscarBeneficiario(id)
    if (!beneficiario) return { rechazo: beneficiarioNoEncontrado(id) }
    return { id, beneficiario, usuario }
  }

  return [
    http.post('*/beneficiarios/:id/autorizacion-tutor', async ({ request, params }) => {
      const ruta = await menorDeLaRuta(request, params.id)
      if (ruta.rechazo) return ruta.rechazo
      const { id, beneficiario, usuario } = ruta

      const formulario = await leerFormulario(request)
      if (!formulario) return solicitudInvalida('El cuerpo debe ser multipart/form-data')
      const errores = validarRegistro(formulario)
      if (errores.length > 0) return solicitudInvalida(errores)

      const soporte = formulario.get('soporte') as File
      if (soporte.size > TAMANO_MAXIMO_SOPORTE) {
        return errorNest(413, 'El soporte no puede pesar más de 5 MB', 'Payload Too Large')
      }
      if (!esMenorDeEdad(beneficiario.fechaNacimiento, fechaDeHoy())) {
        return errorNest(409, 'La autorización del tutor es solo para menores de edad', 'Conflict')
      }
      if (activa(id)) {
        return errorNest(409, 'El menor ya tiene una autorización del tutor activa', 'Conflict')
      }

      const nueva: AutorizacionTutorMock = {
        id: crypto.randomUUID(),
        beneficiarioId: id,
        estado: 'ACTIVA',
        tutor: {
          nombre: texto(formulario.get('nombre')),
          tipoDocumento: texto(formulario.get('tipoDocumento')),
          numeroDocumento: texto(formulario.get('numeroDocumento')),
          parentesco: texto(formulario.get('parentesco')),
          telefono: texto(formulario.get('telefono')),
        },
        soporte,
        aprobadaPor: usuario,
        fechaAprobacion: new Date().toISOString(),
        revocadaEn: null,
        revocadaPor: null,
        motivoRevocacion: null,
      }
      autorizaciones = [nueva, ...autorizaciones]

      return HttpResponse.json(aRespuesta(nueva, 'COORDINADORA'), { status: 201 })
    }),

    http.post('*/beneficiarios/:id/autorizacion-tutor/revocacion', async ({ request, params }) => {
      const ruta = await menorDeLaRuta(request, params.id)
      if (ruta.rechazo) return ruta.rechazo
      const { id, usuario } = ruta

      const cuerpo = (await request.json()) as Record<string, unknown>
      const errores = validarRevocacion(cuerpo)
      if (errores.length > 0) return solicitudInvalida(errores)

      const actual = activa(id)
      if (!actual) {
        return errorNest(404, 'El menor no tiene una autorización del tutor activa', 'Not Found')
      }

      const revocada: AutorizacionTutorMock = {
        ...actual,
        estado: 'REVOCADA',
        revocadaEn: new Date().toISOString(),
        revocadaPor: usuario,
        motivoRevocacion: texto(cuerpo.motivo),
      }
      autorizaciones = autorizaciones.map((a) => (a.id === actual.id ? revocada : a))
      retirarImagenVigente(id, usuario)

      return HttpResponse.json(aRespuesta(revocada, 'COORDINADORA'))
    }),
  ]
}
