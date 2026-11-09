import { isAxiosError, type AxiosInstance, type InternalAxiosRequestConfig } from 'axios'
import type { ErrorApi } from '@/shared/application/errores/ErrorApi.ts'
import { normalizarError } from './normalizarError.ts'

declare module 'axios' {
  export interface AxiosRequestConfig {
    omitirSesion?: boolean
  }
}

export interface SesionHttp {
  readonly obtenerToken: () => string | null
  // Debe borrar el token: así los demás 401 en curso ya no vuelven a avisar.
  readonly alExpirarSesion: () => void
}

export function instalarInterceptoresSesion(instancia: AxiosInstance, sesion: SesionHttp): void {
  instancia.interceptors.request.use((peticion) => agregarToken(peticion, sesion))
  instancia.interceptors.response.use(undefined, (error: unknown) => {
    throw procesarError(error, sesion)
  })
}

function agregarToken(
  peticion: InternalAxiosRequestConfig,
  sesion: SesionHttp,
): InternalAxiosRequestConfig {
  const token = sesion.obtenerToken()
  if (token && !peticion.omitirSesion) {
    peticion.headers.set('Authorization', encabezadoBearer(token))
  }
  return peticion
}

function procesarError(error: unknown, sesion: SesionHttp): ErrorApi {
  const errorApi = normalizarError(error)
  if (errorApi.tipo === 'no-autenticado' && esDeLaSesionActual(error, sesion)) {
    sesion.alExpirarSesion()
  }
  return errorApi
}

// Un 401 solo cierra la sesión si la petición usó el token vigente. Evita avisar varias
// veces y que una respuesta tardía con un token viejo saque a quien ya volvió a entrar.
function esDeLaSesionActual(error: unknown, sesion: SesionHttp): boolean {
  if (!isAxiosError(error) || !error.config || error.config.omitirSesion) return false

  const token = sesion.obtenerToken()
  return token !== null && error.config.headers.get('Authorization') === encabezadoBearer(token)
}

function encabezadoBearer(token: string): string {
  return `Bearer ${token}`
}
