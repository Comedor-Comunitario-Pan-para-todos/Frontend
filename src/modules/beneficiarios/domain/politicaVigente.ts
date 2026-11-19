export interface PoliticaDeDatos {
  readonly version: number
  readonly finalidad: string
}

/** La política que se le explica hoy a la persona. Si cambia el texto, sube la versión. */
export const POLITICA_VIGENTE: PoliticaDeDatos = {
  version: 1,
  finalidad: 'ATENCION_ALIMENTARIA',
}
