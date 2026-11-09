import { useQuery, useQueryClient } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { useDependencias } from '@/app/contextoDependencias.ts'
import type { Credenciales } from '@/modules/auth/application/ports/AuthRepository.ts'
import type { Usuario } from '@/modules/auth/domain/Usuario.ts'
import { ContextoAuth, type Auth, type EstadoSesion } from './contextoAuth.ts'

const CLAVE_USUARIO = ['auth', 'me']

function calcularEstado(pendiente: boolean, usuario: Usuario | null | undefined): EstadoSesion {
  if (pendiente) return 'cargando'
  if (usuario === undefined) return 'error'
  return usuario === null ? 'anonimo' : 'autenticado'
}

export function AuthProvider({ children }: { readonly children: ReactNode }) {
  const { restaurarSesion, iniciarSesion } = useDependencias()
  const cliente = useQueryClient()
  const consulta = useQuery({
    queryKey: CLAVE_USUARIO,
    queryFn: restaurarSesion,
    staleTime: Infinity,
  })

  const auth: Auth = {
    estado: calcularEstado(consulta.isPending, consulta.data),
    usuario: consulta.data ?? null,
    error: consulta.error,
    verificando: consulta.isFetching,
    reintentar: () => void consulta.refetch(),
    iniciarSesion: async (credenciales: Credenciales) => {
      const usuario = await iniciarSesion(credenciales)
      cliente.setQueryData(CLAVE_USUARIO, usuario)
    },
  }

  return <ContextoAuth.Provider value={auth}>{children}</ContextoAuth.Provider>
}
