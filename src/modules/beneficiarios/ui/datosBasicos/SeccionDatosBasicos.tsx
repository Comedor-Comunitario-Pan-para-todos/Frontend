import { MapPin, User } from 'lucide-react'
import { useFormContext } from 'react-hook-form'
import { fechaDeHoy } from '@/shared/domain/fechaDeHoy.ts'
import { Alerta } from '@/shared/ui/Alerta.tsx'
import { CampoTexto } from '@/shared/ui/CampoTexto.tsx'
import type { CamposBasicos } from './esquemaDatosBasicos.ts'

interface SeccionDatosBasicosProps {
  readonly esMenor: boolean
}

/** Va dentro de un `FormProvider` cuyo formulario incluye `CamposBasicos`. */
export function SeccionDatosBasicos({ esMenor }: SeccionDatosBasicosProps) {
  const {
    register,
    formState: { errors },
  } = useFormContext<CamposBasicos>()

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

      <CampoTexto
        etiqueta="Barrio o sector"
        nota="Opcional"
        placeholder="Ej.: El Jardín"
        ayuda="No condiciona la entrega del almuerzo."
        icono={MapPin}
        autoComplete="off"
        autoCapitalize="words"
        error={errors.barrio?.message}
        {...register('barrio')}
      />
    </>
  )
}
