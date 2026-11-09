import type { RouteObject } from 'react-router'
import { LayoutPrincipal } from './layout/LayoutPrincipal.tsx'
import { MODULOS } from './modulos.ts'
import { PaginaError } from './paginas/PaginaError.tsx'
import { PaginaNoEncontrada } from './paginas/PaginaNoEncontrada.tsx'
import { PaginaProximamente } from './paginas/PaginaProximamente.tsx'

export const rutas: RouteObject[] = [
  {
    path: '/',
    element: <LayoutPrincipal />,
    // Si falla el propio layout no hay menú ni márgenes.
    errorElement: (
      <main className="px-gutter py-8">
        <PaginaError />
      </main>
    ),
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
