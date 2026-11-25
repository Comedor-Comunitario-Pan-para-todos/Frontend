import { useQuery } from '@tanstack/react-query'
import { useDependencias } from '@/app/contextoDependencias.ts'

const SIN_BARRIOS: readonly string[] = []

export function useBarrios(): readonly string[] {
  const { consultarBarrios } = useDependencias()
  const barrios = useQuery({
    queryKey: ['beneficiarios', 'barrios'],
    queryFn: ({ signal }) => consultarBarrios(signal),
    retry: false,
  })

  return barrios.data ?? SIN_BARRIOS
}
