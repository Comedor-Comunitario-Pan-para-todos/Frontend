import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm, useWatch } from 'react-hook-form'
import { useNavigate } from 'react-router'
import { useDependencias } from '@/app/contextoDependencias.ts'
import { nombreCompleto, type Beneficiario } from '@/modules/beneficiarios/domain/Beneficiario.ts'
import {
  aCamposBasicos,
  esMenorSegunFecha,
} from '@/modules/beneficiarios/ui/datosBasicos/esquemaDatosBasicos.ts'
import { useConstancia } from '@/shared/ui/constancia/contextoConstancia.ts'
import { aActualizacion, esquemaActualizar, type CamposActualizar } from './esquemaActualizar.ts'

/** Pone al día los datos de una persona ya registrada. */
export function useActualizar(beneficiario: Beneficiario) {
  const { actualizarDatos } = useDependencias()
  const consultas = useQueryClient()
  const navegar = useNavigate()
  const constancia = useConstancia()
  const { id } = beneficiario
  const formulario = useForm<CamposActualizar>({
    resolver: zodResolver(esquemaActualizar),
    mode: 'onTouched',
    defaultValues: aCamposBasicos(beneficiario),
  })
  const fechaNacimiento = useWatch({ control: formulario.control, name: 'fechaNacimiento' })

  const actualizacion = useMutation({
    mutationFn: (campos: CamposActualizar) => actualizarDatos(id, aActualizacion(campos)),
    onSuccess: async (ficha) => {
      const nombre = nombreCompleto(ficha)
      constancia.confirmar({ titulo: 'Datos actualizados', detalle: nombre, resumen: nombre })
      await consultas.invalidateQueries({ queryKey: ['beneficiarios'] })
      await navegar(`/beneficiarios/${id}`, { replace: true })
    },
  })

  return {
    formulario,
    esMenor: esMenorSegunFecha(fechaNacimiento),
    enviar: formulario.handleSubmit((campos) => actualizacion.mutate(campos)),
    enviando: actualizacion.isPending,
    error: actualizacion.error,
  }
}
