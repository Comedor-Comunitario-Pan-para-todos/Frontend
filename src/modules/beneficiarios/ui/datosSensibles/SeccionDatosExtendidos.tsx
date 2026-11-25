import { IdCard, Phone } from 'lucide-react'
import type { ReactNode } from 'react'
import { useFormContext, useWatch } from 'react-hook-form'
import {
  descripcionGrupo,
  etiquetaSistemaClasificacion,
} from '@/modules/beneficiarios/domain/clasificacionSocioeconomica.ts'
import {
  etiquetaTipoDocumento,
  TIPOS_DOCUMENTO,
  type TipoDocumento,
} from '@/modules/beneficiarios/domain/documento.ts'
import { FORMATOS_DOCUMENTO } from '@/modules/beneficiarios/domain/formatoDocumento.ts'
import { CampoTexto } from '@/shared/ui/CampoTexto.tsx'
import { CasillaVerificacion } from '@/shared/ui/CasillaVerificacion.tsx'
import { SelectorOpciones } from '@/shared/ui/SelectorOpciones.tsx'
import type { CamposExtendidos } from './esquemaDatosExtendidos.ts'

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

interface SeccionDatosExtendidosProps {
  readonly avisoDelDocumento?: ReactNode
}

/** Va dentro de un `FormProvider` cuyo formulario incluye `CamposExtendidos`. */
export function SeccionDatosExtendidos({ avisoDelDocumento }: SeccionDatosExtendidosProps) {
  const {
    register,
    control,
    trigger,
    getFieldState,
    formState: { errors },
  } = useFormContext<CamposExtendidos>()
  const [sinDocumento, tipoDocumento, sistema, grupo] = useWatch({
    control,
    name: ['sinDocumento', 'tipoDocumento', 'sistemaClasificacion', 'grupoClasificacion'],
  })
  const admiteLetras = FORMATOS_DOCUMENTO[tipoDocumento as TipoDocumento]?.soloDigitos === false

  // El número que era válido para un tipo puede no serlo para otro.
  function revisarNumeroSiYaSeEscribio() {
    if (getFieldState('numeroDocumento').isTouched) void trigger('numeroDocumento')
  }

  return (
    <div className="flex flex-col gap-4">
      {!sinDocumento && (
        <>
          <SelectorOpciones
            etiqueta="Tipo de documento"
            opciones={OPCIONES_DE_TIPO}
            error={errors.tipoDocumento?.message}
            {...register('tipoDocumento', { onChange: revisarNumeroSiYaSeEscribio })}
          />
          <CampoTexto
            etiqueta="Número de documento"
            placeholder="Ej.: 1023456789"
            icono={IdCard}
            inputMode={admiteLetras ? 'text' : 'numeric'}
            autoComplete="off"
            autoCapitalize={admiteLetras ? 'characters' : undefined}
            className="font-mono"
            error={errors.numeroDocumento?.message}
            {...register('numeroDocumento')}
          />
          {avisoDelDocumento}
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
