import { ArrowLeft } from 'lucide-react'
import { Link, useParams } from 'react-router'
import { useBeneficiario } from '@/modules/beneficiarios/ui/beneficiario/useBeneficiario.ts'
import { esErrorApi } from '@/shared/application/errores/ErrorApi.ts'
import { Alerta } from '@/shared/ui/Alerta.tsx'
import { Boton } from '@/shared/ui/Boton.tsx'
import { mensajeDeError } from '@/shared/ui/mensajeDeError.ts'
import { FormularioActualizar } from './FormularioActualizar.tsx'

export function PaginaActualizar() {
  const { id = '' } = useParams()
  const ficha = useBeneficiario(id)
  const noExiste = esErrorApi(ficha.error) && ficha.error.tipo === 'no-encontrado'

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
        <h1 className="text-heading font-semibold text-ink">Actualizar datos</h1>
        <p className="text-body text-ink-secondary">
          Corrija o ponga al día los datos de la persona.
        </p>
      </header>

      {ficha.isPending && (
        <p role="status" className="text-body text-ink-secondary">
          Cargando la ficha…
        </p>
      )}

      {ficha.isError &&
        (noExiste ? (
          <Alerta tipo="aviso" titulo="No encontramos a esta persona">
            Puede que la dirección esté mal escrita. Vuelva al padrón y búsquela por su nombre.
          </Alerta>
        ) : (
          <>
            <Alerta tipo="peligro" titulo="No pudimos cargar la ficha">
              {mensajeDeError(ficha.error)}
            </Alerta>
            <Boton cargando={ficha.isFetching} onClick={() => void ficha.refetch()}>
              Reintentar
            </Boton>
          </>
        ))}

      {ficha.data && <FormularioActualizar beneficiario={ficha.data} />}
    </div>
  )
}
