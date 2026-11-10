import { IdCard, MapPin, ShieldCheck, User } from 'lucide-react'
import { Link } from 'react-router'
import { useAuth } from '@/modules/auth/index.ts'
import { etiquetaTipoDocumento, TIPOS_DOCUMENTO } from '@/modules/beneficiarios/domain/documento.ts'
import { Alerta } from '@/shared/ui/Alerta.tsx'
import { Boton } from '@/shared/ui/Boton.tsx'
import { CampoTexto } from '@/shared/ui/CampoTexto.tsx'
import { CasillaVerificacion } from '@/shared/ui/CasillaVerificacion.tsx'
import { mensajeDeError } from '@/shared/ui/mensajeDeError.ts'
import { SelectorOpciones } from '@/shared/ui/SelectorOpciones.tsx'
import { AvisoDuplicado } from './AvisoDuplicado.tsx'
import { fechaDeHoy } from './esquemaRegistro.ts'
import type { Registro } from './useRegistro.ts'

interface FormularioRegistroProps {
  readonly registro: Registro
}

const CLASES_TARJETA =
  'flex flex-col gap-4 rounded-lg border border-hairline bg-surface p-4 shadow-card'

const OPCIONES_DE_TIPO = TIPOS_DOCUMENTO.map((tipo) => ({
  valor: tipo,
  etiqueta: tipo,
  nombre: etiquetaTipoDocumento(tipo),
}))

export function FormularioRegistro({ registro }: FormularioRegistroProps) {
  const { usuario } = useAuth()
  const { formulario, sinDocumento, posibleDuplicado } = registro
  const {
    register,
    formState: { errors },
  } = formulario

  return (
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
            icono={User}
            autoComplete="off"
            autoCapitalize="words"
            error={errors.nombres?.message}
            {...register('nombres')}
          />
          <CampoTexto
            etiqueta="Apellidos"
            nota="Obligatorio"
            icono={User}
            autoComplete="off"
            autoCapitalize="words"
            error={errors.apellidos?.message}
            {...register('apellidos')}
          />
        </div>

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
          etiqueta="Fecha de nacimiento"
          nota="Obligatorio"
          type="date"
          max={fechaDeHoy()}
          className="font-mono"
          error={errors.fechaNacimiento?.message}
          {...register('fechaNacimiento')}
        />

        <CampoTexto
          etiqueta="Barrio o sector"
          nota="Opcional"
          ayuda="No condiciona la entrega del almuerzo."
          icono={MapPin}
          autoComplete="off"
          autoCapitalize="words"
          error={errors.barrio?.message}
          {...register('barrio')}
        />
      </section>

      {posibleDuplicado && !registro.yaRegistrada && (
        <AvisoDuplicado duplicado={posibleDuplicado} />
      )}

      <section aria-labelledby="titulo-autorizacion" className={CLASES_TARJETA}>
        <div className="flex items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-sm bg-privacy-soft text-privacy">
            <ShieldCheck aria-hidden="true" className="size-5" />
          </span>
          <div>
            <h2 id="titulo-autorizacion" className="text-body-lg font-semibold text-ink">
              Autorización de datos
            </h2>
            <p className="text-label text-ink-secondary">Ley 1581 de 2012</p>
          </div>
        </div>
        <CasillaVerificacion
          etiqueta="Informé a la persona"
          descripcion="Le expliqué que sus datos se usan solo para la atención del comedor y estuvo de acuerdo."
          error={errors.informado?.message}
          {...register('informado')}
        />
        {usuario && (
          <p className="rounded-sm bg-surface-subtle px-3 py-2 font-mono text-label text-ink-secondary">
            Registra: {usuario.nombreCompleto}
          </p>
        )}
      </section>

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
  )
}
