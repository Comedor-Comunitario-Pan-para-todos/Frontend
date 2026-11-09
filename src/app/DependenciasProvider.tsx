import type { ReactNode } from 'react'
import { ContextoDependencias } from './contextoDependencias.ts'
import type { Dependencias } from './dependencias.ts'

interface DependenciasProviderProps {
  readonly dependencias: Dependencias
  readonly children: ReactNode
}

export function DependenciasProvider({ dependencias, children }: DependenciasProviderProps) {
  return (
    <ContextoDependencias.Provider value={dependencias}>{children}</ContextoDependencias.Provider>
  )
}
