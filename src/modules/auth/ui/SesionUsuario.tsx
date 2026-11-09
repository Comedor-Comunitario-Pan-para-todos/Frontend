import { LogOut } from 'lucide-react'
import type { Rol } from '@/modules/auth/domain/Usuario.ts'
import { Boton } from '@/shared/ui/Boton.tsx'
import { useAuth } from './contextoAuth.ts'

const NOMBRE_ROL: Record<Rol, string> = {
  COORDINADORA: 'Coordinadora',
  PRESIDENTE_JAC: 'Presidente JAC',
  VOLUNTARIO: 'Voluntario',
  DONANTE: 'Donante',
}

export function SesionUsuario() {
  const { usuario, cerrarSesion } = useAuth()

  if (usuario === null) return null

  return (
    <header className="flex items-center justify-between gap-2 border-b border-hairline bg-surface px-gutter py-2 md:px-8 lg:fixed lg:bottom-6 lg:left-4 lg:z-20 lg:w-56 lg:flex-col lg:items-stretch lg:border-t lg:border-b-0 lg:bg-transparent lg:p-0 lg:pt-4">
      <div className="min-w-0 lg:px-4">
        <p className="truncate text-body font-semibold text-ink">{usuario.nombreCompleto}</p>
        <p className="truncate text-label text-ink-secondary">{NOMBRE_ROL[usuario.rol]}</p>
      </div>
      <Boton variante="secundario" onClick={cerrarSesion} className="shrink-0">
        <LogOut aria-hidden="true" className="size-5" />
        Salir
      </Boton>
    </header>
  )
}
