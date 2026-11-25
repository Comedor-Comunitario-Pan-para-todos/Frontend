import { useQuery } from '@tanstack/react-query'
import { useDependencias } from '@/app/contextoDependencias.ts'
import type { Beneficiario } from '@/modules/beneficiarios/domain/Beneficiario.ts'
import { useValorRetrasado } from '@/modules/beneficiarios/ui/useValorRetrasado.ts'

// Los mismos valores del registro: esperar a que deje de escribir y no buscar números muy cortos.
const RETRASO_VERIFICACION_MS = 500
const MINIMO_PARA_VERIFICAR_DOCUMENTO = 5

/**
 * Quien ya tiene en el padrón el documento que se está escribiendo para la persona `id`.
 * `null` mientras no haya nadie más con ese número.
 */
export function useDuenoDelDocumento(id: string, numeroDocumento: string): Beneficiario | null {
  const { verificarDuplicado } = useDependencias()
  const numero = numeroDocumento.trim()
  const numeroPorVerificar = useValorRetrasado(
    numero.length >= MINIMO_PARA_VERIFICAR_DOCUMENTO ? numero : '',
    RETRASO_VERIFICACION_MS,
  )
  const hayQueVerificar = numeroPorVerificar !== ''
  const duplicado = useQuery({
    queryKey: ['beneficiarios', 'duplicado', { numeroDocumento: numeroPorVerificar }],
    queryFn: ({ signal }) => verificarDuplicado({ numeroDocumento: numeroPorVerificar }, signal),
    enabled: hayQueVerificar,
    retry: false,
  })
  const otraPersona = duplicado.data?.beneficiario

  return hayQueVerificar && otraPersona !== undefined && otraPersona.id !== id ? otraPersona : null
}
