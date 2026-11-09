import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { ShieldCheck } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { Navigate, useLocation } from 'react-router'
import { z } from 'zod'
import { Alerta } from '@/shared/ui/Alerta.tsx'
import { Boton } from '@/shared/ui/Boton.tsx'
import { CampoContrasena } from '@/shared/ui/CampoContrasena.tsx'
import { CampoTexto } from '@/shared/ui/CampoTexto.tsx'
import { mensajeDeError } from '@/shared/ui/mensajeDeError.ts'
import { PantallaCarga } from '@/shared/ui/PantallaCarga.tsx'
import { useAuth } from './contextoAuth.ts'

const CLASES_MUESCA = 'absolute size-6 rounded-pill border border-hairline bg-canvas'

const esquemaLogin = z.object({
  email: z.string().trim().check(z.email('Escriba un correo válido.')),
  password: z.string().min(1, 'Escriba su contraseña.'),
})

type CamposLogin = z.infer<typeof esquemaLogin>

function leerDestino(estadoNavegacion: unknown): string {
  const { desde } = (estadoNavegacion ?? {}) as { desde?: string }
  return desde ?? '/'
}

export function PaginaLogin() {
  const { estado, iniciarSesion } = useAuth()
  const location = useLocation()
  const ingreso = useMutation({ mutationFn: iniciarSesion })
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CamposLogin>({ resolver: zodResolver(esquemaLogin) })

  if (estado === 'cargando') return <PantallaCarga mensaje="Verificando su sesión" />
  if (estado === 'autenticado') return <Navigate to={leerDestino(location.state)} replace />

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-narrow flex-col justify-center gap-4 px-gutter py-4 lg:max-w-content">
      <div className="overflow-hidden rounded-lg border border-hairline bg-surface shadow-ticket lg:flex">
        <div className="flex items-center gap-3 bg-primary p-6 text-on-primary lg:w-2/5 lg:flex-col lg:items-start lg:justify-center lg:gap-6 lg:p-8">
          <img src="/brand/logo-white.svg" alt="" className="size-14 shrink-0 lg:size-24" />
          <div>
            <p className="text-title font-semibold lg:text-heading">Pan para Todos</p>
            <p className="text-body">
              Comedor comunitario
              <span className="block">El Jardín, Pereira</span>
            </p>
          </div>
        </div>

        <div
          aria-hidden="true"
          className="relative border-t border-dashed border-border-input lg:border-t-0 lg:border-l"
        >
          <span
            className={`${CLASES_MUESCA} top-0 -left-3 -translate-y-1/2 lg:-top-3 lg:left-0 lg:-translate-x-1/2 lg:translate-y-0`}
          />
          <span
            className={`${CLASES_MUESCA} top-0 -right-3 -translate-y-1/2 lg:top-auto lg:right-auto lg:-bottom-3 lg:left-0 lg:-translate-x-1/2 lg:translate-y-0`}
          />
        </div>

        <form
          noValidate
          onSubmit={(evento) => void handleSubmit((campos) => ingreso.mutate(campos))(evento)}
          className="flex flex-col gap-4 p-6 lg:flex-1 lg:p-8"
        >
          <div className="flex flex-col gap-1">
            <h1 className="text-heading font-semibold text-ink">Iniciar sesión</h1>
            <p className="text-body text-ink-secondary">
              Use el correo y la contraseña que le entregó la coordinación.
            </p>
          </div>

          <CampoTexto
            etiqueta="Correo electrónico"
            type="email"
            inputMode="email"
            autoComplete="username"
            autoCapitalize="none"
            error={errors.email?.message}
            {...register('email')}
          />
          <CampoContrasena
            etiqueta="Contraseña"
            autoComplete="current-password"
            error={errors.password?.message}
            {...register('password')}
          />

          {ingreso.isError && <Alerta tipo="peligro">{mensajeDeError(ingreso.error)}</Alerta>}

          <Boton type="submit" cargando={ingreso.isPending} className="w-full">
            Ingresar
          </Boton>

          <p className="text-center text-label text-ink-secondary">
            Si olvidó su contraseña, comuníquese con la coordinación.
          </p>
        </form>
      </div>

      <p className="flex items-center justify-center gap-2 text-label text-ink-secondary">
        <ShieldCheck aria-hidden="true" className="size-4 shrink-0 text-privacy" />
        Datos protegidos por la Ley 1581 de 2012
      </p>
    </main>
  )
}
