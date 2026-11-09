import { createContext, useContext } from 'react'

export interface AccionConstancia {
  readonly etiqueta: string
  readonly alPresionar: () => void
}

interface MensajeConstancia {
  readonly titulo: string
  readonly detalle?: string
}

export interface AccionesConstancia {
  /** `resumen` es el dato que queda visible en la tira, por ejemplo "Turno 45". */
  confirmar(datos: MensajeConstancia & { readonly resumen: string }): void
  avisarFallo(datos: MensajeConstancia & { readonly reintentar: () => void }): void
  pedirDecision(datos: MensajeConstancia & { readonly accion: AccionConstancia }): void
  cerrar(): void
}

export const ContextoConstancia = createContext<AccionesConstancia | null>(null)

export function useConstancia(): AccionesConstancia {
  const acciones = useContext(ContextoConstancia)
  if (acciones === null) {
    throw new Error('useConstancia debe usarse dentro de ConstanciaProvider')
  }
  return acciones
}
