import { useQuery } from '@tanstack/react-query'
import { useDependencias } from '@/app/contextoDependencias.ts'
import { claveDeLaFicha } from '@/modules/beneficiarios/ui/beneficiario/useBeneficiario.ts'

export function claveDelHistorialDeImagen(idBeneficiario: string) {
  return [...claveDeLaFicha(idBeneficiario), 'historial-imagen']
}

/** Solo se pide al servidor cuando alguien abre el historial. */
export function useHistorialDeImagen(idBeneficiario: string, abierto: boolean) {
  const { consultarHistorialDeImagen } = useDependencias()

  return useQuery({
    queryKey: claveDelHistorialDeImagen(idBeneficiario),
    queryFn: () => consultarHistorialDeImagen(idBeneficiario),
    enabled: abierto,
  })
}
