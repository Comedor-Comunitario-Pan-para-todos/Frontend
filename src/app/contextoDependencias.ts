import { createContext, useContext } from 'react'
import type { Dependencias } from './dependencias.ts'

export const ContextoDependencias = createContext<Dependencias | null>(null)

export function useDependencias(): Dependencias {
  const dependencias = useContext(ContextoDependencias)
  if (dependencias === null) {
    throw new Error('useDependencias debe usarse dentro de DependenciasProvider')
  }
  return dependencias
}
