import { useQuery } from '@tanstack/react-query'
import { useDependencias } from '@/app/contextoDependencias.ts'

export function claveDeLaFicha(id: string) {
  return ['beneficiarios', 'ficha', id]
}

/** La ficha de una persona del padrón. */
export function useBeneficiario(id: string) {
  const { consultarBeneficiario } = useDependencias()

  return useQuery({
    queryKey: claveDeLaFicha(id),
    queryFn: ({ signal }) => consultarBeneficiario(id, signal),
  })
}
