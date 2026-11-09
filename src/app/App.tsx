import { QueryClientProvider } from '@tanstack/react-query'
import { createBrowserRouter } from 'react-router'
import { RouterProvider } from 'react-router/dom'
import { crearQueryClient } from './queryClient.ts'
import { rutas } from './rutas.tsx'

const clienteConsultas = crearQueryClient()
const enrutador = createBrowserRouter(rutas)

export function App() {
  return (
    <QueryClientProvider client={clienteConsultas}>
      <RouterProvider router={enrutador} />
    </QueryClientProvider>
  )
}
