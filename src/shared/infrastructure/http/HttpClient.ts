export interface EsquemaRespuesta<T> {
  parse(datos: unknown): T
}

export type ParametrosConsulta = Record<string, string | number | boolean | undefined>

export interface OpcionesPeticion<T> {
  readonly esquema?: EsquemaRespuesta<T>
  readonly params?: ParametrosConsulta
  readonly signal?: AbortSignal
  readonly omitirSesion?: boolean
  readonly tiempoLimiteMs?: number
}

export interface OpcionesDescarga {
  readonly params?: ParametrosConsulta
  readonly signal?: AbortSignal
  /** Avance entre 0 y 1, o `null` si el servidor no envía el tamaño del archivo. */
  readonly alAvanzar?: (avance: number | null) => void
}

/** Archivo recibido del servidor. */
export interface ArchivoRecibido {
  readonly contenido: Blob
  /** El nombre que propone el servidor en `Content-Disposition`, si lo envía. */
  readonly nombreArchivo: string | null
}

export interface HttpClient {
  get<T = unknown>(ruta: string, opciones?: OpcionesPeticion<T>): Promise<T>
  post<T = unknown>(ruta: string, cuerpo?: unknown, opciones?: OpcionesPeticion<T>): Promise<T>
  patch<T = unknown>(ruta: string, cuerpo?: unknown, opciones?: OpcionesPeticion<T>): Promise<T>
  delete<T = unknown>(ruta: string, opciones?: OpcionesPeticion<T>): Promise<T>
  /** `GET` de un archivo (PDF, Excel…): lo entrega como `Blob`, sin leerlo como JSON. */
  descargar(ruta: string, opciones?: OpcionesDescarga): Promise<ArchivoRecibido>
}
