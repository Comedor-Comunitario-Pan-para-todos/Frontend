import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useDependencias } from '@/app/contextoDependencias.ts'
import { nombreCompleto, type Beneficiario } from '@/modules/beneficiarios/domain/Beneficiario.ts'
import { claveDeLaFicha } from '@/modules/beneficiarios/ui/beneficiario/useBeneficiario.ts'
import { useConstancia } from '@/shared/ui/constancia/contextoConstancia.ts'

/**
 * Pide confirmar antes de retirar la autorización de imagen. Al retirarla, la quita de la ficha
 * sin esperar a que se vuelva a cargar. Si falla, avisa con «Reintentar».
 */
export function useRetirarUsoDeImagen() {
  const { retirarUsoDeImagen } = useDependencias()
  const consultas = useQueryClient()
  const constancia = useConstancia()

  const mutacion = useMutation({
    mutationFn: (ficha: Beneficiario) => retirarUsoDeImagen(ficha.id),
    onSuccess: (_retirada, ficha) => {
      consultas.setQueryData<Beneficiario>(
        claveDeLaFicha(ficha.id),
        (actual) => actual && { ...actual, consentimientoImagen: null },
      )
      const nombre = nombreCompleto(ficha)
      constancia.confirmar({
        titulo: 'Autorización de imagen retirada',
        detalle: nombre,
        resumen: nombre,
      })
    },
    onError: (_error, ficha) => {
      constancia.avisarFallo({
        titulo: 'No se retiró la autorización de imagen',
        detalle: `La autorización de imagen de ${nombreCompleto(ficha)} sigue vigente.`,
        reintentar: () => mutacion.mutate(ficha),
      })
    },
  })

  function pedirConfirmacion(ficha: Beneficiario) {
    constancia.pedirDecision({
      titulo: '¿Retirar la autorización de imagen?',
      detalle: `Desde ahora no se le podrán tomar fotos a ${nombreCompleto(ficha)}.`,
      accion: { etiqueta: 'Sí, retirarla', alPresionar: () => mutacion.mutate(ficha) },
    })
  }

  return { retirar: pedirConfirmacion, retirando: mutacion.isPending }
}
