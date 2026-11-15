import { ArrowLeft } from 'lucide-react'
import { Link, useParams } from 'react-router'
import { nombreCompleto } from '@/modules/beneficiarios/domain/Beneficiario.ts'
import { useBeneficiario } from '@/modules/beneficiarios/ui/beneficiario/useBeneficiario.ts'
import { Alerta } from '@/shared/ui/Alerta.tsx'
import { Boton } from '@/shared/ui/Boton.tsx'
import { mensajeDeError } from '@/shared/ui/mensajeDeError.ts'
import { FormularioCompletar } from './FormularioCompletar.tsx'

export function PaginaCompletar() {
  const { id = '' } = useParams()
  const ficha = useBeneficiario(id)

  return (
    <div className="mx-auto flex w-full max-w-content flex-col gap-4">
      <Link
        to={`/beneficiarios/${id}`}
        className="-ml-2 inline-flex min-h-touch items-center gap-2 self-start rounded-md px-2 text-body font-medium text-ink transition duration-150 ease-press hover:bg-surface-hover"
      >
        <ArrowLeft aria-hidden="true" className="size-5 text-primary" />
        Volver a la ficha
      </Link>

      <header className="flex flex-col gap-1">
        <h1 className="text-heading font-semibold text-ink">Completar datos</h1>
        <p className="text-body text-ink-secondary">
          Documento, teléfono y clasificación de quien se registró en nivel básico.
        </p>
      </header>

      {ficha.isPending && (
        <p role="status" className="text-body text-ink-secondary">
          Cargando la ficha…
        </p>
      )}

      {ficha.isError && (
        <>
          <Alerta tipo="peligro" titulo="No pudimos cargar la ficha">
            {mensajeDeError(ficha.error)}
          </Alerta>
          <Boton cargando={ficha.isFetching} onClick={() => void ficha.refetch()}>
            Reintentar
          </Boton>
        </>
      )}

      {ficha.data?.nivel === 'EXTENDIDO' && (
        <Alerta tipo="aviso" titulo="Esta persona ya tiene registro extendido">
          Sus datos sensibles ya se registraron. Vuelva a la ficha para consultarlos.
        </Alerta>
      )}

      {ficha.data?.nivel === 'BASICO' && (
        <FormularioCompletar id={id} nombre={nombreCompleto(ficha.data)} />
      )}
    </div>
  )
}
