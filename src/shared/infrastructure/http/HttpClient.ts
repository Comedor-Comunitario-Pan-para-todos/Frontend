export interface EsquemaRespuesta<T> {
  parse(datos: unknown): T
}

export type ParametrosConsulta = Record<string, string | number | boolean | undefined>

export interface OpcionesPeticion<T> {
  readonly esquema?: EsquemaRespuesta<T>
  readonly params?: ParametrosConsulta
  readonly signal?: AbortSignal
  readonly omitirSesion?: boolean
}

export interface HttpClient {
  get<T = unknown>(ruta: string, opciones?: OpcionesPeticion<T>): Promise<T>
  post<T = unknown>(ruta: string, cuerpo?: unknown, opciones?: OpcionesPeticion<T>): Promise<T>
  patch<T = unknown>(ruta: string, cuerpo?: unknown, opciones?: OpcionesPeticion<T>): Promise<T>
  delete<T = unknown>(ruta: string, opciones?: OpcionesPeticion<T>): Promise<T>
}
