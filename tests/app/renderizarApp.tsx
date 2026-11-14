import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render } from '@testing-library/react'
import { createMemoryRouter, type RouteObject } from 'react-router'
import { RouterProvider } from 'react-router/dom'
import { crearDependencias } from '@/app/dependencias.ts'
import { DependenciasProvider } from '@/app/DependenciasProvider.tsx'
import { rutas } from '@/app/rutas.tsx'
import { SesionLocalStorage } from '@/modules/auth/infrastructure/dispositivo/SesionLocalStorage.ts'
import { AuthProvider } from '@/modules/auth/ui/AuthProvider.tsx'

export const TOKEN_COORDINADORA = 'mock-token.mock-1'

async function precargarPaginas(lista: readonly RouteObject[]): Promise<void> {
  await Promise.all(
    lista.map(async (ruta) => {
      if (typeof ruta.lazy === 'function') await ruta.lazy()
      if (ruta.children) await precargarPaginas(ruta.children)
    }),
  )
}

await precargarPaginas(rutas)

export function iniciarSesionDePrueba(token = TOKEN_COORDINADORA): void {
  new SesionLocalStorage().guardarToken(token)
}

export function crearClienteDePrueba(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, networkMode: 'always' },
      mutations: { networkMode: 'always' },
    },
  })
}

export function renderizarApp(ruta: string, cliente = crearClienteDePrueba()) {
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
