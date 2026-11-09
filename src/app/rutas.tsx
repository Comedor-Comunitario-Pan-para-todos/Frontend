import type { RouteObject } from 'react-router'
import { RutaProtegida } from '@/modules/auth/ui/RutaProtegida.tsx'
import { PantallaCarga } from '@/shared/ui/PantallaCarga.tsx'
import { LayoutPrincipal } from './layout/LayoutPrincipal.tsx'
import { MODULOS } from './modulos.ts'
import { PaginaError } from './paginas/PaginaError.tsx'
import { PaginaNoEncontrada } from './paginas/PaginaNoEncontrada.tsx'
import { PaginaProximamente } from './paginas/PaginaProximamente.tsx'

// Si falla el propio layout no hay menú ni márgenes.
const ERROR_SIN_LAYOUT = (
  <main className="px-gutter py-8">
    <PaginaError />
  </main>
)

export const rutas: RouteObject[] = [
  {
    path: '/login',
    lazy: async () => {
      const { PaginaLogin } = await import('@/modules/auth/ui/PaginaLogin.tsx')
      return { Component: PaginaLogin }
    },
    hydrateFallbackElement: <PantallaCarga />,
    errorElement: ERROR_SIN_LAYOUT,
  },
  {
    path: '/',
    element: (
      <RutaProtegida>
        <LayoutPrincipal />
      </RutaProtegida>
    ),
    errorElement: ERROR_SIN_LAYOUT,
    children: [
      {
        errorElement: <PaginaError />,
        children: [
          // Cada módulo reemplaza su página "Próximamente" cuando se construye su feature.
          ...MODULOS.map(({ ruta, nombre }) => ({
            path: ruta,
            element: <PaginaProximamente modulo={nombre} />,
          })),
          { path: '*', element: <PaginaNoEncontrada /> },
        ],
      },
    ],
  },
]
