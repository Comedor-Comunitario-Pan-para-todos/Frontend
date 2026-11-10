import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm, useWatch } from 'react-hook-form'
import { useNavigate } from 'react-router'
import { useDependencias } from '@/app/contextoDependencias.ts'
import { nombreCompleto } from '@/modules/beneficiarios/domain/Beneficiario.ts'
import { esBeneficiarioDuplicado } from '@/modules/beneficiarios/domain/BeneficiarioDuplicado.ts'
import { useConstancia } from '@/shared/ui/constancia/contextoConstancia.ts'
import {
  aNuevoBeneficiario,
  CAMPOS_INICIALES,
  esquemaRegistro,
  type CamposRegistro,
} from './esquemaRegistro.ts'
import { useValorRetrasado } from './useValorRetrasado.ts'

// Lo que se espera a que la persona deje de escribir antes de revisar si ya está en el padrón.
const RETRASO_VERIFICACION_MS = 500
// Con menos dígitos casi cualquier número coincide con el de otra persona mientras se escribe.
const MINIMO_PARA_VERIFICAR_DOCUMENTO = 5

/** Estado del formulario de registro: validación, aviso de duplicado y envío. */
export function useRegistro() {
  const { registrarBeneficiario, verificarDuplicado } = useDependencias()
  const consultas = useQueryClient()
  const navegar = useNavigate()
  const constancia = useConstancia()
  const formulario = useForm<CamposRegistro>({
    resolver: zodResolver(esquemaRegistro),
    defaultValues: CAMPOS_INICIALES,
  })

  const [sinDocumento, numeroDocumento, nombres, apellidos, fechaNacimiento] = useWatch({
    control: formulario.control,
    name: ['sinDocumento', 'numeroDocumento', 'nombres', 'apellidos', 'fechaNacimiento'],
  })
  const numero = sinDocumento ? '' : numeroDocumento.trim()
  const porVerificar = useValorRetrasado(
    {
      numeroDocumento: numero.length >= MINIMO_PARA_VERIFICAR_DOCUMENTO ? numero : '',
      nombres: nombres.trim(),
      apellidos: apellidos.trim(),
      fechaNacimiento,
    },
    RETRASO_VERIFICACION_MS,
  )
  const hayQueVerificar =
    porVerificar.numeroDocumento !== '' ||
    (porVerificar.nombres !== '' &&
      porVerificar.apellidos !== '' &&
      porVerificar.fechaNacimiento !== '')

  const duplicado = useQuery({
    queryKey: ['beneficiarios', 'duplicado', porVerificar],
    queryFn: ({ signal }) => verificarDuplicado(porVerificar, signal),
    enabled: hayQueVerificar,
    // Es un aviso de apoyo: si falla no se molesta a quien registra; el servidor decide al guardar.
    retry: false,
  })

  const registro = useMutation({
    mutationFn: (campos: CamposRegistro) => registrarBeneficiario(aNuevoBeneficiario(campos)),
    onSuccess: async (ficha) => {
      const nombre = nombreCompleto(ficha)
      constancia.confirmar({ titulo: 'Persona registrada', detalle: nombre, resumen: nombre })
      await consultas.invalidateQueries({ queryKey: ['beneficiarios'] })
      await navegar(`/beneficiarios/${ficha.id}`, { replace: true })
    },
  })

  return {
    formulario,
    sinDocumento,
    /** Persona del padrón que parece ser la misma que se está registrando. */
    posibleDuplicado: hayQueVerificar ? (duplicado.data ?? null) : null,
    enviar: formulario.handleSubmit((campos) => registro.mutate(campos)),
    enviando: registro.isPending,
    error: registro.error,
    /** El servidor rechazó el registro porque el documento ya está en el padrón. */
    yaRegistrada: esBeneficiarioDuplicado(registro.error),
  }
}

export type Registro = ReturnType<typeof useRegistro>
