import { http, HttpResponse } from 'msw'
import type { Rol } from '@/modules/auth/domain/Usuario.ts'
import { fechaDeHoy } from '@/shared/domain/fechaDeHoy.ts'
import { nombreEnPadronMock } from './beneficiarios.ts'
import { demora } from './demora.ts'
import { esCargaDePagina, esUuid } from './lecturaDePeticion.ts'
import {
  beneficiarioNoEncontrado,
  camposDesconocidos,
  errorNest,
  solicitudInvalida,
} from './respuestasNest.ts'

// Simula el módulo `turnos` del backend con el contrato propuesto para RF-03 (Backend#32).
// Los turnos viven en memoria; al recargar la página vuelven al estado inicial.

function idDelPadron(posicion: number): string {
  return `00000000-0000-4000-8000-${String(posicion).padStart(12, '0')}`
}

/** Rosa, José Aníbal y Luz Dary ya recibieron turno hoy: buscarlas muestra «Ya tiene turno hoy». */
const POSICIONES_YA_ATENDIDAS = [3, 4, 5]

/** Entregarle turno a Pedro Pablo Zapata responde 422, para probar la jornada no disponible. */
export const BENEFICIARIO_JORNADA_NO_DISPONIBLE = idDelPadron(8)

/** La primera vez que se le entrega turno a Gloria Inés Henao falla con 500, para probar «Reintentar». */
export const BENEFICIARIO_QUE_FALLA_UNA_VEZ = idDelPadron(9)

const ROLES_PERMITIDOS: readonly Rol[] = ['COORDINADORA', 'VOLUNTARIO']
const CAMPOS_ENTREGA = ['beneficiarioId']
const FECHA_CALENDARIO = /^\d{4}-\d{2}-\d{2}$/
const CUATRO_MINUTOS = 4 * 60_000

interface TurnoMock {
  readonly id: string
  readonly numero: number
  readonly beneficiario: { readonly id: string; readonly nombreCompleto: string }
  readonly entregadoEn: string
  readonly estado: 'EN_ESPERA'
}

let turnos: TurnoMock[] = []
let yaFallo = false

function fechaDe(turno: TurnoMock): string {
  return fechaDeHoy(new Date(turno.entregadoEn))
}

function turnosDelDia(fecha: string): TurnoMock[] {
  return turnos.filter((turno) => fechaDe(turno) === fecha)
}

function entregar(beneficiarioId: string, nombreCompleto: string, momento: Date): TurnoMock {
  const numero = turnosDelDia(fechaDeHoy(momento)).length + 1
  const turno: TurnoMock = {
    id: `00000000-0000-4000-a000-${String(turnos.length + 1).padStart(12, '0')}`,
    numero,
    beneficiario: { id: beneficiarioId, nombreCompleto },
    entregadoEn: momento.toISOString(),
    estado: 'EN_ESPERA',
  }
  turnos = [...turnos, turno]
  return turno
}

export function reiniciarTurnosMock(): void {
  turnos = []
  yaFallo = false
  const ahora = Date.now()
  POSICIONES_YA_ATENDIDAS.forEach((posicion, indice) => {
    const id = idDelPadron(posicion)
    const minutosAtras = (POSICIONES_YA_ATENDIDAS.length - indice) * CUATRO_MINUTOS
    entregar(id, nombreEnPadronMock(id) ?? 'Persona de prueba', new Date(ahora - minutosAtras))
  })
}
reiniciarTurnosMock()

interface UsuarioIdentificado {
  readonly id: string
  readonly rol: Rol
}

type Identificar = (autorizacion: string | null) => UsuarioIdentificado | undefined

function validarEntrega(cuerpo: Record<string, unknown>): string[] {
  const errores = camposDesconocidos(cuerpo, CAMPOS_ENTREGA)
  const { beneficiarioId } = cuerpo
  if (typeof beneficiarioId !== 'string' || !esUuid(beneficiarioId)) {
    errores.push('beneficiarioId must be a UUID')
  }
  return errores
}

export function crearHandlersTurnos(identificar: Identificar) {
  function rechazoDeAcceso(request: Request) {
    const usuario = identificar(request.headers.get('Authorization'))
    if (!usuario) return errorNest(401, 'Unauthorized', 'Unauthorized')
    if (!ROLES_PERMITIDOS.includes(usuario.rol)) {
      return errorNest(403, 'Forbidden resource', 'Forbidden')
    }
    return null
  }

  return [
    http.get('*/turnos', async ({ request }) => {
      if (esCargaDePagina(request)) return
      await demora()
      const rechazo = rechazoDeAcceso(request)
      if (rechazo) return rechazo

      const fecha = new URL(request.url).searchParams.get('fecha') ?? ''
      if (!FECHA_CALENDARIO.test(fecha)) {
        return solicitudInvalida('fecha must be a valid ISO 8601 date string')
      }
      return HttpResponse.json(turnosDelDia(fecha))
    }),

    http.post('*/turnos', async ({ request }) => {
      await demora()
      const rechazo = rechazoDeAcceso(request)
      if (rechazo) return rechazo

      const cuerpo = (await request.json()) as Record<string, unknown>
      const errores = validarEntrega(cuerpo)
      if (errores.length > 0) return solicitudInvalida(errores)

      const beneficiarioId = cuerpo.beneficiarioId as string
      const nombreCompleto = nombreEnPadronMock(beneficiarioId)
      if (!nombreCompleto) return beneficiarioNoEncontrado(beneficiarioId)

      if (beneficiarioId === BENEFICIARIO_JORNADA_NO_DISPONIBLE) {
        return errorNest(
          422,
          'No hay una jornada abierta para entregar turnos',
          'Unprocessable Entity',
        )
      }
      if (beneficiarioId === BENEFICIARIO_QUE_FALLA_UNA_VEZ && !yaFallo) {
        yaFallo = true
        return errorNest(500, 'Internal server error', 'Internal Server Error')
      }

      const hoy = fechaDeHoy()
      if (turnosDelDia(hoy).some((turno) => turno.beneficiario.id === beneficiarioId)) {
        return errorNest(409, 'El beneficiario ya recibió un turno hoy', 'Conflict')
      }

      return HttpResponse.json(entregar(beneficiarioId, nombreCompleto, new Date()), {
        status: 201,
      })
    }),
  ]
}
