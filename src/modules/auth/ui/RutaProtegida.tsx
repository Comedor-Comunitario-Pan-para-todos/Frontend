import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router'
import { Alerta } from '@/shared/ui/Alerta.tsx'
import { Boton } from '@/shared/ui/Boton.tsx'
import { mensajeDeError } from '@/shared/ui/mensajeDeError.ts'
import { PantallaCarga } from '@/shared/ui/PantallaCarga.tsx'
import { useAuth } from './contextoAuth.ts'

export function RutaProtegida({ children }: { readonly children: ReactNode }) {
  const { estado, error, verificando, finSesion, reintentar } = useAuth()
  const { pathname, search } = useLocation()

  if (estado === 'cargando') return <PantallaCarga mensaje="Verificando su sesión" />

  if (estado === 'anonimo') {
    const estadoLogin = finSesion === 'cerrada' ? undefined : { desde: `${pathname}${search}` }
    return <Navigate to="/login" replace state={estadoLogin} />
  }

  if (estado === 'error') {
    return (
      <main className="mx-auto flex min-h-svh w-full max-w-narrow flex-col justify-center gap-4 px-gutter py-8">
        <Alerta tipo="peligro" titulo="No pudimos verificar su sesión">
          {mensajeDeError(error)}
        </Alerta>
        <Boton cargando={verificando} onClick={reintentar}>
          Reintentar
        </Boton>
      </main>
    )
  }

  return children
}
