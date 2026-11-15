import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router'
import { useDependencias } from '@/app/contextoDependencias.ts'
import { nombreCompleto } from '@/modules/beneficiarios/domain/Beneficiario.ts'
import { esBeneficiarioDuplicado } from '@/modules/beneficiarios/domain/BeneficiarioDuplicado.ts'
import { aDatosExtendidos } from '@/modules/beneficiarios/ui/datosSensibles/esquemaDatosExtendidos.ts'
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
  const formulario = useForm<CamposCompletar>({
    resolver: zodResolver(esquemaCompletar),
    mode: 'onTouched',
    defaultValues: CAMPOS_COMPLETAR_INICIALES,
  })

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
    /** El documento escrito ya es de otra persona del padrón. */
    documentoRepetido: esBeneficiarioDuplicado(completado.error),
  }
}
