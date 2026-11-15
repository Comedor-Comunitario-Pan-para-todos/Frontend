import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm, useWatch } from 'react-hook-form'
import { useNavigate } from 'react-router'
import { useDependencias } from '@/app/contextoDependencias.ts'
import { nombreCompleto } from '@/modules/beneficiarios/domain/Beneficiario.ts'
import { esBeneficiarioDuplicado } from '@/modules/beneficiarios/domain/BeneficiarioDuplicado.ts'
import { aDatosExtendidos } from '@/modules/beneficiarios/ui/datosSensibles/esquemaDatosExtendidos.ts'
import { useValorRetrasado } from '@/modules/beneficiarios/ui/useValorRetrasado.ts'
import { useConstancia } from '@/shared/ui/constancia/contextoConstancia.ts'
import {
  CAMPOS_COMPLETAR_INICIALES,
  esquemaCompletar,
  type CamposCompletar,
} from './esquemaCompletar.ts'

// Los mismos valores del registro: esperar a que deje de escribir y no buscar números muy cortos.
const RETRASO_VERIFICACION_MS = 500
const MINIMO_PARA_VERIFICAR_DOCUMENTO = 5

/** Pasa a nivel extendido a una persona registrada en básico. */
export function useCompletar(id: string) {
  const { completarDatosExtendidos, verificarDuplicado } = useDependencias()
  const consultas = useQueryClient()
  const navegar = useNavigate()
  const constancia = useConstancia()
  const formulario = useForm<CamposCompletar>({
    resolver: zodResolver(esquemaCompletar),
    mode: 'onTouched',
    defaultValues: CAMPOS_COMPLETAR_INICIALES,
  })

  const [sinDocumento, numeroDocumento] = useWatch({
    control: formulario.control,
    name: ['sinDocumento', 'numeroDocumento'],
  })
  const numero = sinDocumento ? '' : numeroDocumento.trim()
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
  const duenoDelDocumento =
    hayQueVerificar && otraPersona !== undefined && otraPersona.id !== id ? otraPersona : null

  const completado = useMutation({
    mutationFn: (campos: CamposCompletar) => completarDatosExtendidos(id, aDatosExtendidos(campos)),
    onSuccess: async (ficha) => {
      const nombre = nombreCompleto(ficha)
      constancia.confirmar({ titulo: 'Datos completados', detalle: nombre, resumen: nombre })
      await consultas.invalidateQueries({ queryKey: ['beneficiarios'] })
      await navegar(`/beneficiarios/${id}`, { replace: true })
    },
  })

  return {
    formulario,
    enviar: formulario.handleSubmit((campos) => completado.mutate(campos)),
    enviando: completado.isPending,
    error: completado.error,
    /** Quien ya tiene en el padrón el documento que se está escribiendo. */
    duenoDelDocumento,
    /** El servidor rechazó el documento porque ya es de otra persona. */
    documentoRepetido: esBeneficiarioDuplicado(completado.error),
  }
}
