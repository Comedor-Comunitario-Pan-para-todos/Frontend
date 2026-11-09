import { Outlet, type RouteObject } from 'react-router'
import { PaginaNoEncontrada } from './paginas/PaginaNoEncontrada.tsx'
import { PaginaProximamente } from './paginas/PaginaProximamente.tsx'

// Cada módulo reemplaza su página "Próximamente" cuando se construye su feature.
const MODULOS = [
  { path: 'turnos', nombre: 'Turnos' },
  { path: 'beneficiarios', nombre: 'Beneficiarios' },
  { path: 'inventario', nombre: 'Inventario' },
  { path: 'reportes', nombre: 'Reportes' },
]

export const rutas: RouteObject[] = [
  {
    path: '/',
    element: (
      <main className="mx-auto w-full max-w-content px-gutter py-8 md:px-8">
        <Outlet />
      </main>
    ),
    children: [
      { index: true, element: <PaginaProximamente modulo="Inicio" /> },
      ...MODULOS.map(({ path, nombre }) => ({
        path,
        element: <PaginaProximamente modulo={nombre} />,
      })),
      { path: '*', element: <PaginaNoEncontrada /> },
    ],
  },
]
