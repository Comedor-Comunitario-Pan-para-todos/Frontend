import axios, { type AxiosInstance, type AxiosRequestConfig } from 'axios'
import { ErrorApi } from '@/shared/application/errores/ErrorApi.ts'
import type { EsquemaRespuesta, HttpClient, OpcionesPeticion } from './HttpClient.ts'
import { instalarInterceptoresSesion, type SesionHttp } from './interceptoresSesion.ts'

export interface ConfiguracionHttp {
  readonly baseUrl: string
  readonly tiempoLimiteMs?: number
  readonly sesion: SesionHttp
}

const TIEMPO_LIMITE_MS = 15_000

function validar<T>(datos: unknown, esquema: EsquemaRespuesta<T> | undefined): T {
  if (!esquema) return datos as T

  try {
    return esquema.parse(datos)
  } catch (causa) {
    throw new ErrorApi({ tipo: 'respuesta-invalida', causa })
  }
}

export class AxiosHttpClient implements HttpClient {
  readonly #axios: AxiosInstance

  constructor({ baseUrl, tiempoLimiteMs = TIEMPO_LIMITE_MS, sesion }: ConfiguracionHttp) {
    this.#axios = axios.create({ baseURL: baseUrl, timeout: tiempoLimiteMs })
    instalarInterceptoresSesion(this.#axios, sesion)
  }

  get<T = unknown>(ruta: string, opciones?: OpcionesPeticion<T>): Promise<T> {
    return this.#enviar({ method: 'get', url: ruta }, opciones)
  }

  post<T = unknown>(ruta: string, cuerpo?: unknown, opciones?: OpcionesPeticion<T>): Promise<T> {
    return this.#enviar({ method: 'post', url: ruta, data: cuerpo }, opciones)
  }

  patch<T = unknown>(ruta: string, cuerpo?: unknown, opciones?: OpcionesPeticion<T>): Promise<T> {
    return this.#enviar({ method: 'patch', url: ruta, data: cuerpo }, opciones)
  }

  delete<T = unknown>(ruta: string, opciones?: OpcionesPeticion<T>): Promise<T> {
    return this.#enviar({ method: 'delete', url: ruta }, opciones)
  }

  async #enviar<T>(peticion: AxiosRequestConfig, opciones: OpcionesPeticion<T> = {}): Promise<T> {
    const { esquema, params, signal, omitirSesion } = opciones
    const respuesta = await this.#axios.request({ ...peticion, params, signal, omitirSesion })
    return validar(respuesta.data, esquema)
  }
}
