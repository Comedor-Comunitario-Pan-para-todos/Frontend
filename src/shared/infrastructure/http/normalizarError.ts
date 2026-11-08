import { isAxiosError, isCancel } from 'axios'
import { z } from 'zod'
import { ErrorApi, esErrorApi, type TipoErrorApi } from '@/shared/application/errores/ErrorApi.ts'

// Cuerpo de error por defecto de NestJS: `message` es texto, o una lista en errores de validación.
const cuerpoErrorNest = z.object({
  message: z.union([z.string(), z.array(z.string())]),
})

export function tipoPorEstado(estado: number): TipoErrorApi {
  if (estado === 400 || estado === 422) return 'validacion'
  if (estado === 401) return 'no-autenticado'
  if (estado === 403) return 'sin-permiso'
  if (estado === 404) return 'no-encontrado'
  if (estado === 409) return 'conflicto'
  if (estado >= 500) return 'servidor'
  return 'desconocido'
}

function mensajesDelCuerpo(cuerpo: unknown): string[] {
  const resultado = cuerpoErrorNest.safeParse(cuerpo)
  if (!resultado.success) return []

  const { message } = resultado.data
  return Array.isArray(message) ? message : [message]
}

export function normalizarError(error: unknown): ErrorApi {
  if (esErrorApi(error)) return error

  if (isCancel(error)) return new ErrorApi({ tipo: 'cancelada', causa: error })

  if (!isAxiosError(error)) return new ErrorApi({ tipo: 'desconocido', causa: error })

  if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
    return new ErrorApi({ tipo: 'tiempo-agotado', causa: error })
  }

  if (!error.response) return new ErrorApi({ tipo: 'red', causa: error })

  const { status, data } = error.response
  return new ErrorApi({
    tipo: tipoPorEstado(status),
    estado: status,
    mensajesServidor: mensajesDelCuerpo(data),
    causa: error,
  })
}
