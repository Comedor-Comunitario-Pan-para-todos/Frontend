import { delay, http, HttpResponse } from 'msw'
import type { Rol } from '@/modules/auth/domain/Usuario.ts'

// Simula el módulo `induccion` del backend con el contrato propuesto (docs/INDUCCION.md).
// El avance vive en memoria por usuario; al recargar vuelve al estado inicial.

/** La primera vez que se marca este tema el guardado falla con 500, para probar «Reintentar». */
export const TEMA_QUE_FALLA_UNA_VEZ = 'alimentos'

interface ModuloMock {
  readonly id: string
  readonly orden: number
  readonly titulo: string
  readonly minutosLectura: number
  readonly puntos: readonly string[]
}

export const MODULOS_INDUCCION: readonly ModuloMock[] = [
  {
    id: 'higiene',
    orden: 1,
    titulo: 'Higiene antes de servir',
    minutosLectura: 2,
    puntos: [
      'Lávate las manos con agua y jabón por 40 segundos al llegar, después de ir al baño y cada vez que toques plata o el celular.',
      'Ponte gorro y delantal, y ven con zapatos cerrados.',
      'Uñas cortas y sin anillos, pulseras ni reloj mientras sirves.',
      'Si tienes gripa o estás mal del estómago, avísale a la coordinadora y ayuda en una tarea lejos de la comida.',
    ],
  },
  {
    id: 'trato-digno',
    orden: 2,
    titulo: 'Trato digno a las personas',
    minutosLectura: 2,
    puntos: [
      'Saluda a cada persona y, si la conoces, llámala por su nombre.',
      'Sirve la misma porción a todos, sin preferencias.',
      'No preguntes por qué viene ni de qué barrio es: aquí se atiende a todo el que llegue.',
      'Nunca tomes fotos de las personas, y menos de los niños.',
    ],
  },
  {
    id: 'alimentos',
    orden: 3,
    titulo: 'Manejo seguro de los alimentos',
    minutosLectura: 2,
    puntos: [
      'Antes de usar un alimento, mira la fecha de vencimiento.',
      'Si algo huele raro, cambió de color o el empaque está roto, apártalo y avísale a la coordinadora.',
      'Lo crudo y lo cocido van en tablas y recipientes distintos.',
      'Lo que sobra va a la nevera apenas se enfríe, tapado y con la fecha del día.',
    ],
  },
  {
    id: 'emergencias',
    orden: 4,
    titulo: 'Qué hacer en una emergencia',
    minutosLectura: 3,
    puntos: [
      'El primer día pregúntale a la coordinadora dónde está el botiquín y el extintor.',
      'Si alguien se quema o se corta, avísale de inmediato a la coordinadora.',
      'Si huele a gas, cierra la llave del cilindro, abre puertas y ventanas, y no prendas nada.',
      'Si alguien se desmaya o hay un incendio, saca a las personas y llama al 123.',
    ],
  },
]

const ROLES_PERMITIDOS: readonly Rol[] = ['COORDINADORA', 'VOLUNTARIO']
const CAMPOS_PROGRESO = ['moduloId', 'leido']

let leidosPorUsuario = new Map<string, string[]>()
let temasQueYaFallaron = new Set<string>()

export function reiniciarInduccionMock(): void {
  // El voluntario de prueba ya leyó el primer tema, como en el Figma.
  leidosPorUsuario = new Map([['mock-3', ['higiene']]])
  temasQueYaFallaron = new Set()
}
reiniciarInduccionMock()

function errorNest(estado: number, mensaje: string | string[], error: string) {
  return HttpResponse.json({ statusCode: estado, message: mensaje, error }, { status: estado })
}

/** La pantalla de la app vive en `/induccion`: abrirla o recargarla no es llamar a la API. */
function esCargaDePagina(request: Request): boolean {
  return request.headers.get('Accept')?.includes('text/html') ?? false
}

function validarProgreso(cuerpo: Record<string, unknown>): string[] {
  const desconocidos = Object.keys(cuerpo)
    .filter((campo) => !CAMPOS_PROGRESO.includes(campo))
    .map((campo) => `property ${campo} should not exist`)
  const errores: string[] = []
  if (typeof cuerpo.moduloId !== 'string' || cuerpo.moduloId === '') {
    errores.push('El módulo es requerido')
  }
  if (typeof cuerpo.leido !== 'boolean') errores.push('leido debe ser verdadero o falso')
  return [...desconocidos, ...errores]
}

interface UsuarioIdentificado {
  readonly id: string
  readonly rol: Rol
}

type Identificar = (autorizacion: string | null) => UsuarioIdentificado | undefined

export function crearHandlersInduccion(identificar: Identificar) {
  function usuarioPermitido(request: Request) {
    const usuario = identificar(request.headers.get('Authorization'))
    if (!usuario) return { rechazo: errorNest(401, 'Unauthorized', 'Unauthorized') }
    if (!ROLES_PERMITIDOS.includes(usuario.rol)) {
      return { rechazo: errorNest(403, 'Forbidden resource', 'Forbidden') }
    }
    return { usuario }
  }

  const progresoDe = (idUsuario: string) => ({
    modulosLeidos: leidosPorUsuario.get(idUsuario) ?? [],
  })

  return [
    http.get('*/induccion', async ({ request }) => {
      if (esCargaDePagina(request)) return
      await delay()
      const { usuario, rechazo } = usuarioPermitido(request)
      if (!usuario) return rechazo
      return HttpResponse.json({ modulos: MODULOS_INDUCCION, progreso: progresoDe(usuario.id) })
    }),

    http.patch('*/induccion/progreso', async ({ request }) => {
      await delay()
      const { usuario, rechazo } = usuarioPermitido(request)
      if (!usuario) return rechazo

      const cuerpo = (await request.json()) as Record<string, unknown>
      const errores = validarProgreso(cuerpo)
      if (errores.length > 0) return errorNest(400, errores, 'Bad Request')

      const moduloId = cuerpo.moduloId as string
      if (!MODULOS_INDUCCION.some((m) => m.id === moduloId)) {
        return errorNest(404, `Módulo de inducción ${moduloId} no encontrado`, 'Not Found')
      }
      if (moduloId === TEMA_QUE_FALLA_UNA_VEZ && !temasQueYaFallaron.has(moduloId)) {
        temasQueYaFallaron.add(moduloId)
        return errorNest(500, 'Internal server error', 'Internal Server Error')
      }

      const otros = progresoDe(usuario.id).modulosLeidos.filter((id) => id !== moduloId)
      leidosPorUsuario.set(usuario.id, cuerpo.leido ? [...otros, moduloId] : otros)
      return HttpResponse.json(progresoDe(usuario.id))
    }),
  ]
}
