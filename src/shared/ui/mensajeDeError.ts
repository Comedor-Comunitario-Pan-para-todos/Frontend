import { esErrorApi, type TipoErrorApi } from '@/shared/application/errores/ErrorApi.ts'

const MENSAJES: Record<TipoErrorApi, string> = {
  red: 'No hay conexión con el servidor. Revise su internet e intente de nuevo.',
  'tiempo-agotado': 'El servidor tardó demasiado en responder. Intente de nuevo.',
  cancelada: 'La operación se canceló.',
  'no-autenticado': 'Su sesión terminó. Vuelva a iniciar sesión.',
  'sin-permiso': 'Su rol no tiene permiso para hacer esto.',
  'no-encontrado': 'No encontramos lo que busca.',
  conflicto: 'Ya existe un registro con estos datos.',
  validacion: 'Revise los datos ingresados.',
  servidor: 'Ocurrió un problema en el servidor. Intente de nuevo en unos minutos.',
  'respuesta-invalida':
    'El servidor respondió algo inesperado. Intente de nuevo o avise a coordinación.',
  desconocido: 'Ocurrió un error inesperado. Intente de nuevo.',
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
