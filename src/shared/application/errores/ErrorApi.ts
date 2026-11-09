export type TipoErrorApi =
  /** No hubo conexión con el servidor. */
  | 'red'
  /** El servidor no respondió a tiempo. */
  | 'tiempo-agotado'
  /** La petición se canceló (por ejemplo, la pantalla se cerró). */
  | 'cancelada'
  /** 401: sin sesión, sesión vencida o credenciales inválidas. */
  | 'no-autenticado'
  /** 403: el rol no tiene permiso. */
  | 'sin-permiso'
  /** 404 */
  | 'no-encontrado'
  /** 409: el registro ya existe o choca con otro. */
  | 'conflicto'
  /** 400 / 422: los datos enviados no son válidos. */
  | 'validacion'
  /** 5xx */
  | 'servidor'
  /** La respuesta no tiene la forma que espera el frontend. */
  | 'respuesta-invalida'
  /** Cualquier otro caso. */
  | 'desconocido'

interface DatosErrorApi {
  readonly tipo: TipoErrorApi
  readonly estado?: number
  readonly mensajesServidor?: readonly string[]
  readonly causa?: unknown
}

export class ErrorApi extends Error {
  readonly tipo: TipoErrorApi
  readonly estado: number | undefined
  readonly mensajesServidor: readonly string[]

  constructor({ tipo, estado, mensajesServidor = [], causa }: DatosErrorApi) {
    super(`Petición fallida: ${tipo}${estado === undefined ? '' : ` (${estado})`}`, {
      cause: causa,
    })
    this.name = 'ErrorApi'
    this.tipo = tipo
    this.estado = estado
    this.mensajesServidor = mensajesServidor
  }
}

export function esErrorApi(error: unknown): error is ErrorApi {
  return error instanceof ErrorApi
}
