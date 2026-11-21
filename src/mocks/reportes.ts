import { delay, http, HttpResponse } from 'msw'
import type { Rol } from '@/modules/auth/domain/Usuario.ts'
import { personasDelPadronMock } from './beneficiarios.ts'
import { crearXlsx } from './xlsxDePrueba.ts'

// Simula el módulo `exportaciones` del backend con el contrato propuesto para RF-18 en
// Backend#62. El backend real todavía no tiene estas rutas.
//
// Como aún no existe el registro de asistencia (turnos, RF-03), la asistencia se inventa con
// una regla fija sobre el padrón simulado:
// * el comedor atiende martes, jueves y sábado desde el 13/01/2026;
// * cada persona va a dos de cada tres jornadas;
// * una de cada cinco personas no autorizó el reporte a la Alcaldía.

/** Pedir el archivo con esta fecha de inicio fuerza un error 500, para probar el aviso de fallo. */
export const DESDE_SERVIDOR_CAIDO = '2026-02-14'

const INICIO_ATENCION = '2026-01-13'
const DIAS_DE_ATENCION: ReadonlySet<number> = new Set([2, 4, 6])
const UN_DIA_MS = 86_400_000
// Para que en `dev:mock` se vea «Generando archivo…».
const RETRASO_DEL_ARCHIVO_MS = import.meta.env.MODE === 'test' ? 0 : 1200
const FECHA_CALENDARIO = /^\d{4}-\d{2}-\d{2}$/
// Solo el Presidente de la JAC exporta el padrón (HU-22).
const ROLES_PERMITIDOS: readonly Rol[] = ['PRESIDENTE_JAC']

interface UsuarioIdentificado {
  readonly rol: Rol
}

type Identificar = (autorizacion: string | null) => UsuarioIdentificado | undefined

function errorNest(estado: number, mensaje: string | string[], error: string) {
  return HttpResponse.json({ statusCode: estado, message: mensaje, error }, { status: estado })
}

function esFechaValida(texto: string | null): texto is string {
  if (texto === null || !FECHA_CALENDARIO.test(texto)) return false
  return new Date(`${texto}T00:00:00.000Z`).toISOString().startsWith(texto)
}

/** Lee `desde` y `hasta`, o devuelve los mensajes de validación como los daría class-validator. */
function leerRango(url: URL): { desde: string; hasta: string } | string[] {
  const desde = url.searchParams.get('desde')
  const hasta = url.searchParams.get('hasta')
  const errores: string[] = []
  if (!esFechaValida(desde)) errores.push('desde must be a valid ISO 8601 date string')
  if (!esFechaValida(hasta)) errores.push('hasta must be a valid ISO 8601 date string')
  if (errores.length > 0 || desde === null || hasta === null) return errores
  if (desde > hasta) return ['La fecha inicial debe ser anterior o igual a la final']
  return { desde, hasta }
}

function diasDeAtencion(desde: string, hasta: string): number[] {
  const inicio = Date.parse(`${desde > INICIO_ATENCION ? desde : INICIO_ATENCION}T00:00:00.000Z`)
  const fin = Date.parse(`${hasta}T00:00:00.000Z`)
  const dias: number[] = []
  for (let momento = inicio; momento <= fin; momento += UN_DIA_MS) {
    if (DIAS_DE_ATENCION.has(new Date(momento).getUTCDay())) dias.push(momento / UN_DIA_MS)
  }
  return dias
}

function asistencia(desde: string, hasta: string) {
  const dias = diasDeAtencion(desde, hasta)
  return personasDelPadronMock()
    .map((persona, indice) => ({
      persona,
      visitas: dias.filter((dia) => (dia + indice) % 3 !== 0).length,
      autorizo: indice % 5 !== 4,
    }))
    .filter(({ visitas }) => visitas > 0)
}

const ENCABEZADO = [
  'Nombres',
  'Apellidos',
  'Tipo de documento',
  'Número de documento',
  'Fecha de nacimiento',
  'Barrio',
  'Visitas en el rango',
] as const

export function crearHandlersReportes(identificar: Identificar) {
  function rechazoDeAcceso(request: Request) {
    const usuario = identificar(request.headers.get('Authorization'))
    if (!usuario) return errorNest(401, 'Unauthorized', 'Unauthorized')
    if (!ROLES_PERMITIDOS.includes(usuario.rol)) {
      return errorNest(403, 'Forbidden resource', 'Forbidden')
    }
    return null
  }

  return [
    http.get('*/exportaciones/beneficiarios/resumen', async ({ request }) => {
      await delay()
      const rechazo = rechazoDeAcceso(request)
      if (rechazo) return rechazo

      const rango = leerRango(new URL(request.url))
      if (Array.isArray(rango)) return errorNest(400, rango, 'Bad Request')

      const filas = asistencia(rango.desde, rango.hasta)
      const incluidas = filas.filter(({ autorizo }) => autorizo).length
      return HttpResponse.json({
        asistieron: filas.length,
        incluidas,
        excluidas: filas.length - incluidas,
      })
    }),

    http.get('*/exportaciones/beneficiarios.xlsx', async ({ request }) => {
      await delay(RETRASO_DEL_ARCHIVO_MS)
      const rechazo = rechazoDeAcceso(request)
      if (rechazo) return rechazo

      const url = new URL(request.url)
      const rango = leerRango(url)
      if (Array.isArray(rango)) return errorNest(400, rango, 'Bad Request')
      if (url.searchParams.get('responsabilidadAceptada') !== 'true') {
        return errorNest(
          400,
          ['Debe aceptar la responsabilidad del manejo de los datos'],
          'Bad Request',
        )
      }
      if (rango.desde === DESDE_SERVIDOR_CAIDO) {
        return errorNest(500, 'Internal server error', 'Internal Server Error')
      }

      const incluidas = asistencia(rango.desde, rango.hasta).filter(({ autorizo }) => autorizo)
      if (incluidas.length === 0) {
        return errorNest(409, 'Nadie del rango autorizó el reporte a la Alcaldía', 'Conflict')
      }

      const { bytes, tipo } = crearXlsx('Padrón', [
        ENCABEZADO,
        ...incluidas.map(({ persona, visitas }) => [
          persona.nombres,
          persona.apellidos,
          persona.tipoDocumento,
          persona.numeroDocumento,
          persona.fechaNacimiento,
          persona.barrio,
          visitas,
        ]),
      ])

      return new HttpResponse(bytes, {
        headers: {
          'Content-Type': tipo,
          'Content-Length': String(bytes.byteLength),
          'Content-Disposition': `attachment; filename="padron-beneficiarios_${rango.desde}_a_${rango.hasta}.xlsx"`,
        },
      })
    }),
  ]
}
