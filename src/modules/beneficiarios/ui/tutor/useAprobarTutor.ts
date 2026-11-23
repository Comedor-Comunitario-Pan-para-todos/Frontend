import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { useNavigate } from 'react-router'
import { useDependencias } from '@/app/contextoDependencias.ts'
import { nombreCompleto, type Beneficiario } from '@/modules/beneficiarios/domain/Beneficiario.ts'
import { claveDeLaFicha } from '@/modules/beneficiarios/ui/beneficiario/useBeneficiario.ts'
import { useConstancia } from '@/shared/ui/constancia/contextoConstancia.ts'
import {
  aNuevaAutorizacionTutor,
  CAMPOS_TUTOR_INICIALES,
  esquemaTutor,
  type CamposTutor,
} from './esquemaTutor.ts'

/** Aprueba al tutor de un menor con el papel que firmó, y vuelve a la ficha. */
export function useAprobarTutor(ficha: Beneficiario) {
  const { registrarAutorizacionTutor, prepararSoporte } = useDependencias()
  const consultas = useQueryClient()
  const navegar = useNavigate()
  const constancia = useConstancia()
  const [preparandoSoporte, setPreparandoSoporte] = useState(false)
  const formulario = useForm<CamposTutor>({
    resolver: zodResolver(esquemaTutor),
    mode: 'onTouched',
    defaultValues: CAMPOS_TUTOR_INICIALES,
  })
  const soporte = useWatch({ control: formulario.control, name: 'soporte' })

  async function elegirSoporte(archivo: File) {
    setPreparandoSoporte(true)
    const preparado = await prepararSoporte(archivo)
    setPreparandoSoporte(false)
    formulario.setValue('soporte', preparado, { shouldValidate: true, shouldTouch: true })
  }

  function quitarSoporte() {
    formulario.setValue('soporte', null)
  }

  const aprobacion = useMutation({
    mutationFn: (campos: CamposTutor) =>
      registrarAutorizacionTutor(ficha.id, aNuevaAutorizacionTutor(campos)),
    onSuccess: async (autorizacion) => {
      consultas.setQueryData<Beneficiario>(
        claveDeLaFicha(ficha.id),
        (actual) => actual && { ...actual, autorizacionTutor: autorizacion },
      )
      const nombre = nombreCompleto(ficha)
      constancia.confirmar({
        titulo: 'Tutor aprobado',
        detalle: `${autorizacion.tutor.nombre}, tutor de ${nombre}.`,
        resumen: nombre,
      })
      await navegar(`/beneficiarios/${ficha.id}`, { replace: true })
    },
  })

  return {
    formulario,
    soporte,
    preparandoSoporte,
    elegirSoporte: (archivo: File) => void elegirSoporte(archivo),
    quitarSoporte,
    enviar: formulario.handleSubmit((campos) => aprobacion.mutate(campos)),
    enviando: aprobacion.isPending,
    error: aprobacion.error,
  }
}
