import axios, { isAxiosError, type AxiosInstance, type AxiosRequestConfig } from 'axios'
import { ErrorApi, esErrorApi } from '@/shared/application/errores/ErrorApi.ts'
import type {
  ArchivoRecibido,
  EsquemaRespuesta,
  HttpClient,
  OpcionesDescarga,
  OpcionesPeticion,
} from './HttpClient.ts'
import { instalarInterceptoresSesion, type SesionHttp } from './interceptoresSesion.ts'
import { nombreDeArchivo } from './nombreDeArchivo.ts'
import { mensajesDelCuerpo } from './normalizarError.ts'

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

/**
 * Con `responseType: 'blob'` el cuerpo de un error también llega como `Blob`, y sin leerlo se
 * perdería el mensaje del servidor (por ejemplo, el de un 409). Si es JSON, se recuperan sus
 * mensajes; si no, queda el error tal como llegó.
 */
async function conMensajesDelServidor(error: unknown): Promise<unknown> {
  if (!esErrorApi(error) || error.mensajesServidor.length > 0) return error

  const causa = error.cause
  if (!isAxiosError(causa) || !(causa.response?.data instanceof Blob)) return error

  try {
    const mensajes = mensajesDelCuerpo(JSON.parse(await causa.response.data.text()))
    if (mensajes.length === 0) return error
    return new ErrorApi({
      tipo: error.tipo,
      estado: error.estado,
      mensajesServidor: mensajes,
      causa,
    })
  } catch {
    return error
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

  async descargar(ruta: string, opciones: OpcionesDescarga = {}): Promise<ArchivoRecibido> {
    const { params, signal, alAvanzar } = opciones
    const respuesta = await this.#axios
      .request<unknown>({
        method: 'get',
        url: ruta,
        params,
        signal,
        responseType: 'blob',
        onDownloadProgress: alAvanzar
          ? ({ loaded, total }) => alAvanzar(total ? Math.min(loaded / total, 1) : null)
          : undefined,
      })
      .catch(async (error: unknown) => {
        throw await conMensajesDelServidor(error)
      })

    if (!(respuesta.data instanceof Blob)) {
      throw new ErrorApi({ tipo: 'respuesta-invalida', estado: respuesta.status })
    }

    const disposicion = respuesta.headers['content-disposition']
    return {
      contenido: respuesta.data,
      nombreArchivo: nombreDeArchivo(typeof disposicion === 'string' ? disposicion : null),
    }
  }

  async #enviar<T>(peticion: AxiosRequestConfig, opciones: OpcionesPeticion<T> = {}): Promise<T> {
    const { esquema, params, signal, omitirSesion, tiempoLimiteMs } = opciones
    const respuesta = await this.#axios.request({
      ...peticion,
      params,
      signal,
      omitirSesion,
      timeout: tiempoLimiteMs,
    })
    return validar(respuesta.data, esquema)
  }
}
