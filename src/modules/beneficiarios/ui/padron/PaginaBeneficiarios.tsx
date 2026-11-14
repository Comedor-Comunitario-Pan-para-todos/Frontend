import { UserPlus } from 'lucide-react'
import { Link } from 'react-router'
import { usePermiso } from '@/modules/auth/index.ts'
import { BuscadorBeneficiarios } from './BuscadorBeneficiarios.tsx'
import { ResultadosPadron } from './ResultadosPadron.tsx'
import { usePadron } from './usePadron.ts'

export function PaginaBeneficiarios() {
  const padron = usePadron()
  const puedeRegistrar = usePermiso('beneficiarios.registrar')

  return (
    <div className="mx-auto flex w-full max-w-content flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-heading font-semibold text-ink">Beneficiarios</h1>
        <p className="text-body text-ink-secondary">
          Busque a la persona antes de registrarla, para no anotarla dos veces.
        </p>
      </header>

      <BuscadorBeneficiarios valor={padron.texto} alCambiar={padron.cambiarTexto} />

      {puedeRegistrar && (
        <Link
          to="/beneficiarios/nuevo"
          className="inline-flex min-h-touch items-center gap-2 self-start rounded-md text-body font-semibold text-primary transition duration-150 ease-press hover:text-primary-hover"
        >
          <UserPlus aria-hidden="true" className="size-5 shrink-0" />
          ¿No está en el padrón? Registrar persona
        </Link>
      )}

      <ResultadosPadron padron={padron} />
    </div>
  )
}
