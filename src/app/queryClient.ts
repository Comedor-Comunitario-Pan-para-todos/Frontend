import { QueryClient } from '@tanstack/react-query'
import { esErrorApi } from '@/shared/application/errores/ErrorApi.ts'

const MAX_REINTENTOS = 2
const VIGENCIA_DATOS_MS = 30_000

export function debeReintentar(fallos: number, error: unknown): boolean {
  if (fallos >= MAX_REINTENTOS || !esErrorApi(error)) return false
  return error.tipo === 'red' || error.tipo === 'servidor'
}

export function crearQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: debeReintentar, staleTime: VIGENCIA_DATOS_MS, networkMode: 'always' },
      mutations: { retry: false, networkMode: 'always' },
    },
  })
}
