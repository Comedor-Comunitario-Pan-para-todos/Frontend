import { useQuery } from '@tanstack/react-query'
import { useDependencias } from '@/app/contextoDependencias.ts'

export const CLAVE_GUIA = ['induccion', 'guia'] as const

/** La guía de inducción con el avance de quien tiene la sesión abierta. */
export function useGuiaInduccion() {
  const { consultarGuiaInduccion } = useDependencias()

  return useQuery({ queryKey: CLAVE_GUIA, queryFn: () => consultarGuiaInduccion() })
}
