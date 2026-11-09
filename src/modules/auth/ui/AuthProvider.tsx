import { useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'
import { useEffect, useState, type ReactNode } from 'react'
import { useDependencias } from '@/app/contextoDependencias.ts'
import type { Credenciales } from '@/modules/auth/application/ports/AuthRepository.ts'
import type { Usuario } from '@/modules/auth/domain/Usuario.ts'
import { ContextoAuth, type Auth, type EstadoSesion, type FinSesion } from './contextoAuth.ts'

const CLAVE_USUARIO = ['auth', 'me']

function calcularEstado(pendiente: boolean, usuario: Usuario | null | undefined): EstadoSesion {
  if (pendiente) return 'cargando'
  if (usuario === undefined) return 'error'
  return usuario === null ? 'anonimo' : 'autenticado'
}

function vaciarDatos(cliente: QueryClient): void {
  cliente.removeQueries({ predicate: ({ queryKey }) => queryKey[0] !== CLAVE_USUARIO[0] })
  cliente.getMutationCache().clear()
}

function quitarUsuario(cliente: QueryClient): void {
  cliente.setQueryData(CLAVE_USUARIO, null)
  vaciarDatos(cliente)
}

export function AuthProvider({ children }: { readonly children: ReactNode }) {
  const {
    restaurarSesion,
    iniciarSesion,
    cerrarSesion,
    suscribirExpiracion,
    suscribirCambioDeToken,
  } = useDependencias()
  const cliente = useQueryClient()
  const [finSesion, setFinSesion] = useState<FinSesion | null>(null)
  const consulta = useQuery({
    queryKey: CLAVE_USUARIO,
    queryFn: restaurarSesion,
    staleTime: Infinity,
  })

  useEffect(() => {
    const dejarDeOirExpiracion = suscribirExpiracion(() => {
      setFinSesion('vencida')
      quitarUsuario(cliente)
    })

    const dejarDeOirToken = suscribirCambioDeToken((token) => {
      if (token === null) {
        setFinSesion('cerrada')
        quitarUsuario(cliente)
        return
      }
      // Otra pestaña inició sesión, quizá con otra persona: se pregunta de nuevo quién es.
      setFinSesion(null)
      vaciarDatos(cliente)
      void cliente.invalidateQueries({ queryKey: CLAVE_USUARIO })
    })

    return () => {
      dejarDeOirExpiracion()
      dejarDeOirToken()
    }
  }, [cliente, suscribirExpiracion, suscribirCambioDeToken])

  const auth: Auth = {
    estado: calcularEstado(consulta.isPending, consulta.data),
    usuario: consulta.data ?? null,
    error: consulta.error,
    verificando: consulta.isFetching,
    finSesion,
    reintentar: () => void consulta.refetch(),
    iniciarSesion: async (credenciales: Credenciales) => {
      const usuario = await iniciarSesion(credenciales)
      cliente.setQueryData(CLAVE_USUARIO, usuario)
      setFinSesion(null)
    },
    cerrarSesion: () => {
      cerrarSesion()
      setFinSesion('cerrada')
      quitarUsuario(cliente)
    },
  }

  return <ContextoAuth.Provider value={auth}>{children}</ContextoAuth.Provider>
}
