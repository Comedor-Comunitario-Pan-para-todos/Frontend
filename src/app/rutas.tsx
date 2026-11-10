import { Outlet, type RouteObject } from 'react-router'
import { ConPermiso } from '@/modules/auth/ui/ConPermiso.tsx'
import { RutaProtegida } from '@/modules/auth/ui/RutaProtegida.tsx'
import { PantallaCarga } from '@/shared/ui/PantallaCarga.tsx'
import { LayoutPrincipal } from './layout/LayoutPrincipal.tsx'
import { MODULOS } from './modulos.ts'
import { PaginaError } from './paginas/PaginaError.tsx'
import { PaginaNoEncontrada } from './paginas/PaginaNoEncontrada.tsx'
import { PaginaProximamente } from './paginas/PaginaProximamente.tsx'
import { PaginaSinAcceso } from './paginas/PaginaSinAcceso.tsx'

// Si falla el propio layout no hay menú ni márgenes.
const ERROR_SIN_LAYOUT = (
  <main className="px-gutter py-8">
    <PaginaError />
  </main>
)

// Páginas ya construidas de cada módulo. Los que no aparecen aquí muestran "Próximamente".
const PAGINAS_DE_MODULO: Readonly<Record<string, RouteObject[]>> = {
  '/beneficiarios': [
    {
      index: true,
      lazy: async () => {
        const { PaginaBeneficiarios } =
          await import('@/modules/beneficiarios/ui/PaginaBeneficiarios.tsx')
        return { Component: PaginaBeneficiarios }
      },
      hydrateFallbackElement: <PantallaCarga />,
    },
    {
      path: 'nuevo',
      lazy: async () => {
        const { PaginaRegistro } = await import('@/modules/beneficiarios/ui/PaginaRegistro.tsx')
        return { Component: PaginaRegistro }
      },
      hydrateFallbackElement: <PantallaCarga />,
    },
    {
      path: ':id',
      lazy: async () => {
        const { PaginaFicha } = await import('@/modules/beneficiarios/ui/PaginaFicha.tsx')
        return { Component: PaginaFicha }
      },
      hydrateFallbackElement: <PantallaCarga />,
    },
  ],
}

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
          // El permiso del módulo cubre también todas sus páginas internas.
          ...MODULOS.map(({ ruta, nombre, permiso }) => {
            const paginas = PAGINAS_DE_MODULO[ruta]

            return {
              path: ruta,
              element: (
                <ConPermiso permiso={permiso} alternativa={<PaginaSinAcceso />}>
                  {paginas ? <Outlet /> : <PaginaProximamente modulo={nombre} />}
                </ConPermiso>
              ),
              children: paginas,
            }
          }),
          { path: '*', element: <PaginaNoEncontrada /> },
        ],
      },
    ],
  },
]
