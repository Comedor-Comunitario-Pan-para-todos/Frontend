import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm, useWatch } from 'react-hook-form'
import { useNavigate } from 'react-router'
import { useDependencias } from '@/app/contextoDependencias.ts'
import { usePermiso } from '@/modules/auth/index.ts'
import { nombreCompleto, type Beneficiario } from '@/modules/beneficiarios/domain/Beneficiario.ts'
import { esBeneficiarioDuplicado } from '@/modules/beneficiarios/domain/BeneficiarioDuplicado.ts'
import { esMenorSegunFecha } from '@/modules/beneficiarios/ui/datosBasicos/esquemaDatosBasicos.ts'
import { useDuenoDelDocumento } from '@/modules/beneficiarios/ui/datosSensibles/useDuenoDelDocumento.ts'
import { useConstancia } from '@/shared/ui/constancia/contextoConstancia.ts'
import {
  aActualizacion,
  aCamposActualizar,
  crearEsquemaActualizar,
  type CamposActualizar,
} from './esquemaActualizar.ts'

/** Pone al día los datos de una persona ya registrada. */
export function useActualizar(beneficiario: Beneficiario) {
  const { actualizarDatos } = useDependencias()
  const consultas = useQueryClient()
  const navegar = useNavigate()
  const constancia = useConstancia()
  const { id } = beneficiario
  // En nivel básico no hay datos sensibles que actualizar: eso es «Completar datos».
  const conSensibles =
    usePermiso('beneficiarios.actualizarDatosSensibles') && beneficiario.nivel === 'EXTENDIDO'
  const formulario = useForm<CamposActualizar>({
    resolver: zodResolver(crearEsquemaActualizar(conSensibles)),
    mode: 'onTouched',
    defaultValues: aCamposActualizar(beneficiario),
  })
  const [fechaNacimiento, sinDocumento, numeroDocumento] = useWatch({
    control: formulario.control,
    name: ['fechaNacimiento', 'sinDocumento', 'numeroDocumento'],
  })
  const duenoDelDocumento = useDuenoDelDocumento(
    id,
    conSensibles && !sinDocumento ? numeroDocumento : '',
  )

  const actualizacion = useMutation({
    mutationFn: (campos: CamposActualizar) =>
      actualizarDatos(id, aActualizacion(campos, conSensibles)),
    onSuccess: async (ficha) => {
      const nombre = nombreCompleto(ficha)
      constancia.confirmar({ titulo: 'Datos actualizados', detalle: nombre, resumen: nombre })
      await consultas.invalidateQueries({ queryKey: ['beneficiarios'] })
      await navegar(`/beneficiarios/${id}`, { replace: true })
    },
    // Lleva a corregir el número, que es donde está el aviso.
    onError: (error) => {
      if (esBeneficiarioDuplicado(error)) formulario.setFocus('numeroDocumento')
    },
  })

  return {
    formulario,
    conSensibles,
    esMenor: esMenorSegunFecha(fechaNacimiento),
    enviar: formulario.handleSubmit((campos) => actualizacion.mutate(campos)),
    enviando: actualizacion.isPending,
    error: actualizacion.error,
    duenoDelDocumento,
    documentoRepetido: esBeneficiarioDuplicado(actualizacion.error),
  }
}
