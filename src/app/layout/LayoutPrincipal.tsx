import { Outlet, useLocation } from 'react-router'
import { ConstanciaProvider } from '@/shared/ui/constancia/ConstanciaProvider.tsx'
import { NavegacionPrincipal } from './NavegacionPrincipal.tsx'

export function LayoutPrincipal() {
  const { pathname } = useLocation()

  return (
    <ConstanciaProvider pantalla={pathname}>
      <div className="lg:pl-64">
        <NavegacionPrincipal />
        <main className="mx-auto w-full max-w-wide px-gutter pt-8 pb-24 md:px-8 lg:pt-12 lg:pb-8">
          <Outlet />
        </main>
      </div>
    </ConstanciaProvider>
  )
}
