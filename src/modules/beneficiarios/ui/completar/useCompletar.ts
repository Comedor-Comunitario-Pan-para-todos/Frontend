import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm, useWatch } from 'react-hook-form'
import { useNavigate } from 'react-router'
import { useDependencias } from '@/app/contextoDependencias.ts'
import { nombreCompleto } from '@/modules/beneficiarios/domain/Beneficiario.ts'
import { esBeneficiarioDuplicado } from '@/modules/beneficiarios/domain/BeneficiarioDuplicado.ts'
import { aDatosExtendidos } from '@/modules/beneficiarios/ui/datosSensibles/esquemaDatosExtendidos.ts'
import { useDuenoDelDocumento } from '@/modules/beneficiarios/ui/datosSensibles/useDuenoDelDocumento.ts'
import { useGuardarConsentimiento } from '@/modules/beneficiarios/ui/datosSensibles/useGuardarConsentimiento.ts'
import { useConstancia } from '@/shared/ui/constancia/contextoConstancia.ts'
import {
  CAMPOS_COMPLETAR_INICIALES,
  esquemaCompletar,
  type CamposCompletar,
} from './esquemaCompletar.ts'

/** Pasa a nivel extendido a una persona registrada en básico. */
export function useCompletar(id: string) {
  const { completarDatosExtendidos } = useDependencias()
  const consultas = useQueryClient()
  const navegar = useNavigate()
  const constancia = useConstancia()
  const guardarConsentimiento = useGuardarConsentimiento()
  const formulario = useForm<CamposCompletar>({
    resolver: zodResolver(esquemaCompletar),
    mode: 'onTouched',
    defaultValues: CAMPOS_COMPLETAR_INICIALES,
  })

  const [sinDocumento, numeroDocumento] = useWatch({
    control: formulario.control,
    name: ['sinDocumento', 'numeroDocumento'],
  })
  const duenoDelDocumento = useDuenoDelDocumento(id, sinDocumento ? '' : numeroDocumento)

  const completado = useMutation({
    mutationFn: (campos: CamposCompletar) => completarDatosExtendidos(id, aDatosExtendidos(campos)),
    onSuccess: async (ficha) => {
      const nombre = nombreCompleto(ficha)
      await guardarConsentimiento(ficha, () =>
        constancia.confirmar({ titulo: 'Datos completados', detalle: nombre, resumen: nombre }),
      )
      await consultas.invalidateQueries({ queryKey: ['beneficiarios'] })
      await navegar(`/beneficiarios/${id}`, { replace: true })
    },
    onError: (error) => {
      if (esBeneficiarioDuplicado(error)) formulario.setFocus('numeroDocumento')
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
