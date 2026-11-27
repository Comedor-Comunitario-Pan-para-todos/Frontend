import { ArrowLeft, PencilLine, UserPen } from 'lucide-react'
import { Link, useParams } from 'react-router'
import { useBeneficiario } from '@/modules/beneficiarios/ui/beneficiario/useBeneficiario.ts'
import { esErrorApi } from '@/shared/application/errores/ErrorApi.ts'
import { Alerta } from '@/shared/ui/Alerta.tsx'
import { Boton } from '@/shared/ui/Boton.tsx'
import { mensajeDeError } from '@/shared/ui/mensajeDeError.ts'
import { Autorizaciones } from './Autorizaciones.tsx'
import { DatosDelComensal } from './DatosDelComensal.tsx'

const CLASES_TARJETA = 'rounded-lg border border-hairline bg-surface p-4 shadow-card'

const CLASES_ENLACE =
  'inline-flex min-h-touch w-full items-center justify-center gap-2 rounded-md px-6 py-2 text-body-lg font-semibold transition duration-150 ease-press active:translate-y-px active:scale-99 md:w-auto'

const CLASES_ACTUALIZAR = `${CLASES_ENLACE} border border-border-input bg-surface text-ink hover:bg-surface-hover`

const CLASES_COMPLETAR = `${CLASES_ENLACE} bg-primary-soft text-primary hover:text-primary-hover`

function EsperaDeLaFicha() {
  return (
    <div aria-hidden="true" className={`flex animate-pulse flex-col gap-4 ${CLASES_TARJETA}`}>
      <div className="flex items-center gap-3">
        <span className="size-14 shrink-0 rounded-md bg-surface-subtle" />
        <span className="h-8 w-2/3 rounded-sm bg-surface-subtle" />
      </div>
      <span className="h-10 w-full rounded-sm bg-surface-subtle" />
      <span className="h-10 w-full rounded-sm bg-surface-subtle" />
    </div>
  )
}

export function PaginaFicha() {
  const { id = '' } = useParams()
  const ficha = useBeneficiario(id)
  const noExiste = esErrorApi(ficha.error) && ficha.error.tipo === 'no-encontrado'

  return (
    <div className="mx-auto flex w-full max-w-content flex-col gap-4">
      <Link
        to="/beneficiarios"
        className="-ml-2 inline-flex min-h-touch items-center gap-2 self-start rounded-md px-2 text-body font-medium text-ink transition duration-150 ease-press hover:bg-surface-hover"
      >
        <ArrowLeft aria-hidden="true" className="size-5 text-primary" />
        Volver al padrón
      </Link>

      {ficha.isPending && (
        <>
          <p role="status" className="sr-only">
            Cargando la ficha…
          </p>
          <EsperaDeLaFicha />
        </>
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

      {ficha.data && (
        <DatosDelComensal beneficiario={ficha.data} className={CLASES_TARJETA}>
          {ficha.data.nivel === 'BASICO' && (
            <Link to={`/beneficiarios/${id}/completar`} className={CLASES_COMPLETAR}>
              <PencilLine aria-hidden="true" className="size-5 shrink-0" />
              Completar datos
            </Link>
          )}
          <Link to={`/beneficiarios/${id}/actualizar`} className={CLASES_ACTUALIZAR}>
            <UserPen aria-hidden="true" className="size-5 shrink-0" />
            Actualizar datos
          </Link>
        </DatosDelComensal>
      )}

      {ficha.data && <Autorizaciones beneficiario={ficha.data} className={CLASES_TARJETA} />}
    </div>
  )
}
