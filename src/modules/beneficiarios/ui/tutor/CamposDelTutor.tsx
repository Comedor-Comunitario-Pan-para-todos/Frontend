import { IdCard, Phone, UserRound } from 'lucide-react'
import { useFormContext, useWatch } from 'react-hook-form'
import {
  etiquetaTipoDocumento,
  TIPOS_DOCUMENTO_TUTOR,
  type TipoDocumentoTutor,
} from '@/modules/beneficiarios/domain/documento.ts'
import { FORMATOS_DOCUMENTO } from '@/modules/beneficiarios/domain/formatoDocumento.ts'
import { etiquetaParentesco, PARENTESCOS } from '@/modules/beneficiarios/domain/parentesco.ts'
import { CampoTexto } from '@/shared/ui/CampoTexto.tsx'
import { SelectorOpciones } from '@/shared/ui/SelectorOpciones.tsx'
import type { CamposTutor } from './esquemaTutor.ts'

const OPCIONES_DE_PARENTESCO = PARENTESCOS.map((parentesco) => ({
  valor: parentesco,
  etiqueta: etiquetaParentesco(parentesco),
}))

const OPCIONES_DE_TIPO = TIPOS_DOCUMENTO_TUTOR.map((tipo) => ({
  valor: tipo,
  etiqueta: tipo === 'PASAPORTE' ? 'Pasaporte' : tipo,
  nombre: etiquetaTipoDocumento(tipo),
}))

/** Los datos de quien firmó, tal como están en el papel. Va dentro del `FormProvider` del tutor. */
export function CamposDelTutor() {
  const {
    register,
    control,
    trigger,
    getFieldState,
    formState: { errors },
  } = useFormContext<CamposTutor>()
  const tipoDocumento = useWatch({ control, name: 'tipoDocumento' })
  const admiteLetras =
    FORMATOS_DOCUMENTO[tipoDocumento as TipoDocumentoTutor]?.soloDigitos === false

  // El número que era válido para un tipo puede no serlo para otro.
  function revisarNumeroSiYaSeEscribio() {
    if (getFieldState('numeroDocumento').isTouched) void trigger('numeroDocumento')
  }

  return (
    <div className="flex flex-col gap-4">
      <CampoTexto
        etiqueta="Nombre del tutor"
        placeholder="Como aparece en el papel"
        icono={UserRound}
        autoComplete="off"
        autoCapitalize="words"
        error={errors.nombre?.message}
        {...register('nombre')}
      />
      <SelectorOpciones
        etiqueta="Qué es del menor"
        opciones={OPCIONES_DE_PARENTESCO}
        envolver
        error={errors.parentesco?.message}
        {...register('parentesco')}
      />
      <SelectorOpciones
        etiqueta="Tipo de documento"
        opciones={OPCIONES_DE_TIPO}
        error={errors.tipoDocumento?.message}
        {...register('tipoDocumento', { onChange: revisarNumeroSiYaSeEscribio })}
      />
      <CampoTexto
        etiqueta="Número de documento"
        placeholder="Ej.: 52123456"
        icono={IdCard}
        inputMode={admiteLetras ? 'text' : 'numeric'}
        autoComplete="off"
        autoCapitalize={admiteLetras ? 'characters' : undefined}
        className="font-mono"
        error={errors.numeroDocumento?.message}
        {...register('numeroDocumento')}
      />
      <CampoTexto
        etiqueta="Teléfono del tutor"
        placeholder="Ej.: 310 555 1234"
        icono={Phone}
        type="tel"
        inputMode="tel"
        autoComplete="off"
        className="font-mono"
        error={errors.telefono?.message}
        {...register('telefono')}
      />
    </div>
  )
}
