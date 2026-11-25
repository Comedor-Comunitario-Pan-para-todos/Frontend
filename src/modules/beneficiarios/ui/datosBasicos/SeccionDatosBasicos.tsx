import { MapPin, User } from 'lucide-react'
import type { FocusEvent } from 'react'
import { useFormContext, useWatch } from 'react-hook-form'
import { barrioRegistrado } from '@/modules/beneficiarios/domain/barrio.ts'
import { fechaDeHoy } from '@/shared/domain/fechaDeHoy.ts'
import { Alerta } from '@/shared/ui/Alerta.tsx'
import { CampoTexto } from '@/shared/ui/CampoTexto.tsx'
import type { CamposBasicos } from './esquemaDatosBasicos.ts'
import { SugerenciasBarrio } from './SugerenciasBarrio.tsx'
import { useBarrios } from './useBarrios.ts'

interface SeccionDatosBasicosProps {
  readonly esMenor: boolean
}

/** Va dentro de un `FormProvider` cuyo formulario incluye `CamposBasicos`. */
export function SeccionDatosBasicos({ esMenor }: SeccionDatosBasicosProps) {
  const {
    register,
    setValue,
    setFocus,
    control,
    formState: { errors },
  } = useFormContext<CamposBasicos>()
  const barrios = useBarrios()
  const barrio = useWatch({ control, name: 'barrio' })

  function elegirBarrio(elegido: string) {
    setValue('barrio', elegido, { shouldDirty: true, shouldTouch: true, shouldValidate: true })
    setFocus('barrio')
  }

  function unificarBarrio(evento: FocusEvent<HTMLDivElement>) {
    if (evento.currentTarget.contains(evento.relatedTarget)) return
    const registrado = barrioRegistrado(barrio, barrios)
    if (registrado !== null) setValue('barrio', registrado)
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <CampoTexto
          etiqueta="Nombres"
          nota="Obligatorio"
          placeholder="Ej.: María Elena"
          icono={User}
          autoComplete="off"
          autoCapitalize="words"
          error={errors.nombres?.message}
          {...register('nombres')}
        />
        <CampoTexto
          etiqueta="Apellidos"
          nota="Obligatorio"
          placeholder="Ej.: Restrepo Gómez"
          icono={User}
          autoComplete="off"
          autoCapitalize="words"
          error={errors.apellidos?.message}
          {...register('apellidos')}
        />
      </div>

      <CampoTexto
        etiqueta="Fecha de nacimiento"
        nota="Obligatorio"
        type="date"
        max={fechaDeHoy()}
        className="font-mono"
        error={errors.fechaNacimiento?.message}
        {...register('fechaNacimiento')}
      />
      {esMenor && (
        <Alerta tipo="privacidad" titulo="Es menor de edad">
          Recibe la ración como cualquier persona. Su imagen queda protegida: no se le toman fotos
          sin la autorización escrita de su madre, padre o tutor.
        </Alerta>
      )}

      <div className="flex flex-col gap-2" onBlur={unificarBarrio}>
        <CampoTexto
          etiqueta="Barrio o sector"
          nota="Opcional"
          placeholder="Ej.: El Jardín"
          ayuda="No condiciona la entrega de la ración. Si la persona no quiere decirlo, déjelo en blanco."
          icono={MapPin}
          autoComplete="off"
          autoCapitalize="words"
          error={errors.barrio?.message}
          {...register('barrio')}
        />
        <SugerenciasBarrio escrito={barrio} barrios={barrios} onElegir={elegirBarrio} />
      </div>
    </>
  )
}
