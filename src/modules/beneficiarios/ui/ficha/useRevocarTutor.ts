import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useDependencias } from '@/app/contextoDependencias.ts'
import { nombreCompleto, type Beneficiario } from '@/modules/beneficiarios/domain/Beneficiario.ts'
import { claveDeLaFicha } from '@/modules/beneficiarios/ui/beneficiario/useBeneficiario.ts'
import { useConstancia } from '@/shared/ui/constancia/contextoConstancia.ts'
import { claveDelHistorialDeImagen } from './useHistorialDeImagen.ts'

interface Revocacion {
  readonly ficha: Beneficiario
  readonly nombreTutor: string
  readonly motivo: string
}

/**
 * Pide confirmar antes de revocar al tutor. Al revocarlo, el servidor retira también la
 * autorización de fotos del menor, y la ficha lo refleja sin volver a cargar.
 */
export function useRevocarTutor() {
  const { revocarAutorizacionTutor } = useDependencias()
  const consultas = useQueryClient()
  const constancia = useConstancia()

  const mutacion = useMutation({
    mutationFn: ({ ficha, motivo }: Revocacion) => revocarAutorizacionTutor(ficha.id, motivo),
    onSuccess: (revocada, { ficha, nombreTutor }) => {
      consultas.setQueryData<Beneficiario>(
        claveDeLaFicha(ficha.id),
        (actual) =>
          actual && { ...actual, autorizacionTutor: revocada, consentimientoImagen: null },
      )
      void consultas.invalidateQueries({ queryKey: claveDelHistorialDeImagen(ficha.id) })
      const nombre = nombreCompleto(ficha)
      constancia.confirmar({
        titulo: 'Tutor revocado',
        detalle: `${nombreTutor} ya no es el tutor aprobado de ${nombre}.`,
        resumen: nombre,
      })
    },
    onError: (_error, revocacion) => {
      constancia.avisarFallo({
        titulo: 'No se revocó al tutor',
        detalle: `${revocacion.nombreTutor} sigue siendo el tutor aprobado de ${nombreCompleto(revocacion.ficha)}.`,
        reintentar: () => mutacion.mutate(revocacion),
      })
    },
  })

  function pedirConfirmacion(revocacion: Revocacion) {
    const { ficha, nombreTutor } = revocacion
    const fotos = ficha.consentimientoImagen ? ' También se retira la autorización de fotos.' : ''
    constancia.pedirDecision({
      titulo: '¿Revocar al tutor?',
      detalle: `${nombreTutor} dejará de ser el tutor aprobado de ${nombreCompleto(ficha)}.${fotos}`,
      accion: { etiqueta: 'Sí, revocarlo', alPresionar: () => mutacion.mutate(revocacion) },
    })
  }

  return { revocar: pedirConfirmacion, revocando: mutacion.isPending }
}
