import { useQueryClient } from '@tanstack/react-query'
import { useDependencias } from '@/app/contextoDependencias.ts'
import { nombreCompleto, type Beneficiario } from '@/modules/beneficiarios/domain/Beneficiario.ts'
import { useConstancia } from '@/shared/ui/constancia/contextoConstancia.ts'

/**
 * Guarda la autorización de una persona ya registrada. Si falla, avisa con «Reintentar»:
 * se reintenta solo la autorización, sin volver a registrar a la persona.
 */
export function useGuardarConsentimiento() {
  const { registrarConsentimiento } = useDependencias()
  const consultas = useQueryClient()
  const constancia = useConstancia()

  async function guardarConsentimiento(ficha: Beneficiario, alGuardar: () => void) {
    try {
      await registrarConsentimiento(ficha.id)
      await consultas.invalidateQueries({ queryKey: ['beneficiarios'] })
      alGuardar()
    } catch {
      constancia.avisarFallo({
        titulo: 'No se guardó la autorización',
        detalle: `Falta guardar la autorización de datos de ${nombreCompleto(ficha)}.`,
        reintentar: () => void guardarConsentimiento(ficha, alGuardar),
      })
    }
  }

  return guardarConsentimiento
}
