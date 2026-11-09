import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render } from '@testing-library/react'
import { createMemoryRouter } from 'react-router'
import { RouterProvider } from 'react-router/dom'
import { crearDependencias } from '@/app/dependencias.ts'
import { DependenciasProvider } from '@/app/DependenciasProvider.tsx'
import { rutas } from '@/app/rutas.tsx'
import { SesionLocalStorage } from '@/modules/auth/infrastructure/dispositivo/SesionLocalStorage.ts'
import { AuthProvider } from '@/modules/auth/ui/AuthProvider.tsx'

export const TOKEN_COORDINADORA = 'mock-token.mock-1'

export function iniciarSesionDePrueba(): void {
  new SesionLocalStorage().guardarToken(TOKEN_COORDINADORA)
}

export function renderizarApp(ruta: string) {
  const cliente = new QueryClient({
    defaultOptions: {
      queries: { retry: false, networkMode: 'always' },
      mutations: { networkMode: 'always' },
    },
  })
  const enrutador = createMemoryRouter(rutas, { initialEntries: [ruta] })

  render(
    <DependenciasProvider dependencias={crearDependencias({ apiBaseUrl: '/api' })}>
      <QueryClientProvider client={cliente}>
        <AuthProvider>
          <RouterProvider router={enrutador} />
        </AuthProvider>
      </QueryClientProvider>
    </DependenciasProvider>,
  )

  return enrutador
}
