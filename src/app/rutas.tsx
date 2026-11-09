import type { RouteObject } from 'react-router'
import { LayoutPrincipal } from './layout/LayoutPrincipal.tsx'
import { MODULOS } from './modulos.ts'
import { PaginaNoEncontrada } from './paginas/PaginaNoEncontrada.tsx'
import { PaginaProximamente } from './paginas/PaginaProximamente.tsx'

export const rutas: RouteObject[] = [
  {
    path: '/',
    element: <LayoutPrincipal />,
    children: [
      // Cada módulo reemplaza su página "Próximamente" cuando se construye su feature.
      ...MODULOS.map(({ ruta, nombre }) => ({
        path: ruta,
        element: <PaginaProximamente modulo={nombre} />,
      })),
      { path: '*', element: <PaginaNoEncontrada /> },
    ],
  },
]
