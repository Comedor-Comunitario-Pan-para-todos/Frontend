import { NavLink } from 'react-router'
import { MODULOS } from '../modulos.ts'

const CLASES_ENLACE =
  'flex min-h-touch w-full flex-col items-center justify-center gap-0.5 rounded-md text-label font-medium transition duration-150 ease-press active:scale-99 lg:flex-row lg:justify-start lg:gap-3 lg:px-4 lg:text-body'

function clasesEnlace({ isActive }: { readonly isActive: boolean }) {
  const estado = isActive
    ? 'bg-primary-soft text-primary'
    : 'text-ink-secondary hover:bg-surface-hover'
  return `${CLASES_ENLACE} ${estado}`
}

export function NavegacionPrincipal() {
  return (
    <nav
      aria-label="Principal"
      className="fixed inset-x-0 bottom-0 z-10 border-t border-hairline bg-surface px-1 pt-2 pb-safe lg:top-0 lg:right-auto lg:w-64 lg:border-t-0 lg:border-r lg:px-4 lg:pt-12 lg:pb-6"
    >
      <p className="hidden px-4 pb-6 text-title font-semibold text-ink lg:block">Pan para Todos</p>
      <ul className="flex gap-2 lg:flex-col">
        {MODULOS.map(({ ruta, nombre, Icono }) => (
          <li key={ruta} className="min-w-12 flex-auto lg:flex-none">
            <NavLink to={ruta} end={ruta === '/'} className={clasesEnlace}>
              <Icono aria-hidden="true" className="size-5" />
              {nombre}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
