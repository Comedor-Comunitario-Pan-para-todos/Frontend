import { useQuery } from '@tanstack/react-query'
import { useDependencias } from '@/app/contextoDependencias.ts'

export const CLAVE_TURNOS_DE_HOY = ['turnos', 'hoy'] as const

/** Los turnos entregados hoy, con el último de primero. */
export function useTurnosDeHoy() {
  const { consultarTurnosDeHoy } = useDependencias()

  return useQuery({ queryKey: CLAVE_TURNOS_DE_HOY, queryFn: () => consultarTurnosDeHoy() })
}
