import { useQuery } from '@tanstack/react-query'
import { useDependencias } from '@/app/contextoDependencias.ts'

/** La ficha de una persona del padrón. */
export function useBeneficiario(id: string) {
  const { consultarBeneficiario } = useDependencias()

  return useQuery({
    queryKey: ['beneficiarios', 'ficha', id],
    queryFn: ({ signal }) => consultarBeneficiario(id, signal),
  })
}
