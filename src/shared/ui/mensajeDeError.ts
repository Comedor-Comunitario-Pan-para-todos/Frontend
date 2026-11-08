import { esErrorApi, type TipoErrorApi } from '@/shared/application/errores/ErrorApi.ts'

const MENSAJES: Record<TipoErrorApi, string> = {
  red: 'No hay conexión con el servidor. Revisa tu internet e intenta de nuevo.',
  'tiempo-agotado': 'El servidor tardó demasiado en responder. Intenta de nuevo.',
  cancelada: 'La operación se canceló.',
  'no-autenticado': 'Tu sesión terminó. Vuelve a iniciar sesión.',
  'sin-permiso': 'Tu rol no tiene permiso para hacer esto.',
  'no-encontrado': 'No encontramos lo que buscas.',
  conflicto: 'Ya existe un registro con estos datos.',
  validacion: 'Revisa los datos ingresados.',
  servidor: 'Ocurrió un problema en el servidor. Intenta de nuevo en unos minutos.',
  'respuesta-invalida':
    'El servidor respondió algo inesperado. Intenta de nuevo o avisa a coordinación.',
  desconocido: 'Ocurrió un error inesperado. Intenta de nuevo.',
}

const USAN_MENSAJE_DEL_SERVIDOR: ReadonlySet<TipoErrorApi> = new Set([
  'no-autenticado',
  'conflicto',
  'validacion',
])

export function mensajeDeError(error: unknown): string {
  if (!esErrorApi(error)) return MENSAJES.desconocido

  if (USAN_MENSAJE_DEL_SERVIDOR.has(error.tipo) && error.mensajesServidor.length > 0) {
    return error.mensajesServidor.join('. ')
  }

  return MENSAJES[error.tipo]
}
