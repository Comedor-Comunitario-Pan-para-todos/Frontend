import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useDependencias } from '@/app/contextoDependencias.ts'
import { nombreCompleto, type Beneficiario } from '@/modules/beneficiarios/domain/Beneficiario.ts'
import { claveDeLaFicha } from '@/modules/beneficiarios/ui/beneficiario/useBeneficiario.ts'
import { useConstancia } from '@/shared/ui/constancia/contextoConstancia.ts'
import { claveDelHistorialDeImagen } from './useHistorialDeImagen.ts'

/**
 * Guarda la autorización de imagen y la pone de una vez en la ficha, sin esperar a que se
 * vuelva a cargar. Si falla, avisa con «Reintentar».
 */
export function useAutorizarUsoDeImagen() {
  const { autorizarUsoDeImagen } = useDependencias()
  const consultas = useQueryClient()
  const constancia = useConstancia()

  const mutacion = useMutation({
    mutationFn: (ficha: Beneficiario) => autorizarUsoDeImagen(ficha.id),
    onSuccess: (autorizacion, ficha) => {
      consultas.setQueryData<Beneficiario>(
        claveDeLaFicha(ficha.id),
        (actual) => actual && { ...actual, consentimientoImagen: autorizacion },
      )
      void consultas.invalidateQueries({ queryKey: claveDelHistorialDeImagen(ficha.id) })
      const nombre = nombreCompleto(ficha)
      constancia.confirmar({
        titulo: 'Autorización de imagen guardada',
        detalle: nombre,
        resumen: nombre,
      })
    },
    onError: (_error, ficha) => {
      constancia.avisarFallo({
        titulo: 'No se guardó la autorización de imagen',
        detalle: `Falta guardar la autorización de imagen de ${nombreCompleto(ficha)}.`,
        reintentar: () => mutacion.mutate(ficha),
      })
    },
  })

  return { autorizar: mutacion.mutate, autorizando: mutacion.isPending }
}
