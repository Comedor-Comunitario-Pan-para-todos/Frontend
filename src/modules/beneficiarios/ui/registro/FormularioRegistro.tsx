import { LockKeyhole, MapPin, User } from 'lucide-react'
import { FormProvider } from 'react-hook-form'
import { Link } from 'react-router'
import type { NivelCaptura } from '@/modules/beneficiarios/domain/nivelCaptura.ts'
import { SeccionAutorizacion } from '@/modules/beneficiarios/ui/datosSensibles/SeccionAutorizacion.tsx'
import { SeccionDatosExtendidos } from '@/modules/beneficiarios/ui/datosSensibles/SeccionDatosExtendidos.tsx'
import { fechaDeHoy } from '@/shared/domain/fechaDeHoy.ts'
import { Alerta } from '@/shared/ui/Alerta.tsx'
import { Boton } from '@/shared/ui/Boton.tsx'
import { CampoTexto } from '@/shared/ui/CampoTexto.tsx'
import { mensajeDeError } from '@/shared/ui/mensajeDeError.ts'
import { SelectorOpciones } from '@/shared/ui/SelectorOpciones.tsx'
import { AvisoDuplicado } from './AvisoDuplicado.tsx'
import type { Registro } from './useRegistro.ts'

interface FormularioRegistroProps {
  readonly registro: Registro
}

const CLASES_TARJETA =
  'flex flex-col gap-4 rounded-lg border border-hairline bg-surface p-4 shadow-card'

const OPCIONES_DE_NIVEL = [
  { valor: 'BASICO', etiqueta: 'Básico' },
  { valor: 'EXTENDIDO', etiqueta: 'Extendido' },
]

const AYUDA_NIVEL: Record<NivelCaptura, string> = {
  BASICO: 'Basta con el nombre y la fecha de nacimiento para recibir la ración.',
  EXTENDIDO: 'Agrega documento, teléfono y clasificación. Solo la coordinación los ve completos.',
}

export function FormularioRegistro({ registro }: FormularioRegistroProps) {
  const { formulario, nivel, posibleDuplicado } = registro
  const {
    register,
    formState: { errors },
  } = formulario

  return (
    <FormProvider {...formulario}>
      <form
        noValidate
        onSubmit={(evento) => void registro.enviar(evento)}
        className="flex flex-col gap-4"
      >
        <section aria-label="Datos de la persona" className={CLASES_TARJETA}>
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
          {registro.esMenor && (
            <Alerta tipo="privacidad" titulo="Es menor de edad">
              Recibe la ración como cualquier persona. Su imagen queda protegida: no se le toman
              fotos sin la autorización escrita de su madre, padre o tutor.
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
        </section>

        <section aria-labelledby="titulo-nivel" className={CLASES_TARJETA}>
          <div className="flex items-center gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-sm bg-privacy-soft text-privacy">
              <LockKeyhole aria-hidden="true" className="size-5" />
            </span>
            <div>
              <h2 id="titulo-nivel" className="text-body-lg font-semibold text-ink">
                Datos sensibles
              </h2>
              <p className="text-label text-ink-secondary">Se pueden completar después</p>
            </div>
          </div>
          <SelectorOpciones
            etiqueta="Nivel de registro"
            opciones={OPCIONES_DE_NIVEL}
            ayuda={AYUDA_NIVEL[nivel]}
            {...register('nivel')}
          />
          {nivel === 'EXTENDIDO' && <SeccionDatosExtendidos />}
        </section>

        {posibleDuplicado && !registro.yaRegistrada && (
          <AvisoDuplicado duplicado={posibleDuplicado} />
        )}

        <SeccionAutorizacion esMenor={registro.esMenor} className={CLASES_TARJETA} />

        {registro.yaRegistrada && (
          <div className="flex flex-col gap-2">
            <Alerta tipo="peligro" titulo="Esta persona ya está en el padrón">
              No se registró de nuevo: ya hay alguien con ese número de documento.
            </Alerta>
            {posibleDuplicado && <AvisoDuplicado duplicado={posibleDuplicado} />}
          </div>
        )}
        {registro.error !== null && !registro.yaRegistrada && (
          <Alerta tipo="peligro" titulo="No se pudo registrar">
            {mensajeDeError(registro.error)} Lo que escribió sigue aquí.
          </Alerta>
        )}

        <div className="flex flex-col gap-2 md:flex-row-reverse md:justify-start">
          <Boton type="submit" cargando={registro.enviando} className="w-full md:w-auto">
            Registrar persona
          </Boton>
          <Link
            to="/beneficiarios"
            className="inline-flex min-h-touch w-full items-center justify-center rounded-md border border-border-input bg-surface px-6 py-2 text-body-lg font-semibold text-ink transition duration-150 ease-press hover:bg-surface-hover active:translate-y-px active:scale-99 md:w-auto"
          >
            Cancelar
          </Link>
        </div>
      </form>
    </FormProvider>
  )
}
