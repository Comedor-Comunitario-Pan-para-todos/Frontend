import { QueryClientProvider } from '@tanstack/react-query'
import { createBrowserRouter } from 'react-router'
import { RouterProvider } from 'react-router/dom'
import { AuthProvider } from '@/modules/auth/ui/AuthProvider.tsx'
import { AvisoSinConexion } from '@/shared/ui/AvisoSinConexion.tsx'
import { crearDependencias } from './dependencias.ts'
import { DependenciasProvider } from './DependenciasProvider.tsx'
import { entorno } from './entorno.ts'
import { crearQueryClient } from './queryClient.ts'
import { rutas } from './rutas.tsx'

const dependencias = crearDependencias(entorno)
const clienteConsultas = crearQueryClient()
const enrutador = createBrowserRouter(rutas)

export function App() {
  return (
    <DependenciasProvider dependencias={dependencias}>
      <QueryClientProvider client={clienteConsultas}>
        <AvisoSinConexion />
        <AuthProvider>
          <RouterProvider router={enrutador} />
        </AuthProvider>
      </QueryClientProvider>
    </DependenciasProvider>
  )
}
