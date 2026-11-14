import { IdCard, Phone } from 'lucide-react'
import { useWatch, type UseFormReturn } from 'react-hook-form'
import {
  descripcionGrupo,
  etiquetaSistemaClasificacion,
} from '@/modules/beneficiarios/domain/clasificacionSocioeconomica.ts'
import { etiquetaTipoDocumento, TIPOS_DOCUMENTO } from '@/modules/beneficiarios/domain/documento.ts'
import { CampoTexto } from '@/shared/ui/CampoTexto.tsx'
import { CasillaVerificacion } from '@/shared/ui/CasillaVerificacion.tsx'
import { SelectorOpciones } from '@/shared/ui/SelectorOpciones.tsx'
import type { CamposRegistro } from './esquemaRegistro.ts'

interface SeccionDatosExtendidosProps {
  readonly formulario: UseFormReturn<CamposRegistro>
}

const OPCIONES_DE_TIPO = TIPOS_DOCUMENTO.map((tipo) => ({
  valor: tipo,
  etiqueta: tipo,
  nombre: etiquetaTipoDocumento(tipo),
}))

const OPCIONES_DE_SISTEMA = [
  { valor: '', etiqueta: 'Sin dato' },
  { valor: 'RUI', etiqueta: 'RUI', nombre: etiquetaSistemaClasificacion('RUI') },
  { valor: 'SISBEN_IV', etiqueta: etiquetaSistemaClasificacion('SISBEN_IV') },
]

export function SeccionDatosExtendidos({ formulario }: SeccionDatosExtendidosProps) {
  const {
    register,
    control,
    formState: { errors },
  } = formulario
  const [sinDocumento, sistema, grupo] = useWatch({
    control,
    name: ['sinDocumento', 'sistemaClasificacion', 'grupoClasificacion'],
  })

  return (
    <div className="flex flex-col gap-4">
      {!sinDocumento && (
        <>
          <SelectorOpciones
            etiqueta="Tipo de documento"
            opciones={OPCIONES_DE_TIPO}
            error={errors.tipoDocumento?.message}
            {...register('tipoDocumento')}
          />
          <CampoTexto
            etiqueta="Número de documento"
            placeholder="Ej.: 1023456789"
            icono={IdCard}
            inputMode="numeric"
            autoComplete="off"
            className="font-mono"
            error={errors.numeroDocumento?.message}
            {...register('numeroDocumento')}
          />
        </>
      )}

      <div className="rounded-md bg-warning-soft px-3">
        <CasillaVerificacion
          etiqueta="Sin documento"
          descripcion="Para quien no lo tiene o no lo trae. No impide recibir la ración."
          {...register('sinDocumento')}
        />
      </div>

      <CampoTexto
        etiqueta="Teléfono"
        nota="Opcional"
        placeholder="Ej.: 310 555 1234"
        icono={Phone}
        type="tel"
        inputMode="tel"
        autoComplete="off"
        className="font-mono"
        error={errors.telefono?.message}
        {...register('telefono')}
      />

      <SelectorOpciones
        etiqueta="Clasificación socioeconómica"
        opciones={OPCIONES_DE_SISTEMA}
        ayuda="RUI o Sisbén IV, según lo que tenga la persona."
        {...register('sistemaClasificacion')}
      />
      {sistema !== '' && (
        <CampoTexto
          etiqueta="Grupo"
          placeholder="Ej.: C12"
          autoComplete="off"
          autoCapitalize="characters"
          className="font-mono uppercase"
          ayuda={descripcionGrupo(grupo.trim().toUpperCase()) || 'De A1 a D21.'}
          error={errors.grupoClasificacion?.message}
          {...register('grupoClasificacion')}
        />
      )}
    </div>
  )
}
