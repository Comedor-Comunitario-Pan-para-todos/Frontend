import { ArrowLeft, PencilLine, ShieldCheck } from 'lucide-react'
import { Link, useParams } from 'react-router'
import { esMenorDeEdad } from '@/modules/beneficiarios/domain/edad.ts'
import { useBeneficiario } from '@/modules/beneficiarios/ui/beneficiario/useBeneficiario.ts'
import { esErrorApi } from '@/shared/application/errores/ErrorApi.ts'
import { fechaDeHoy } from '@/shared/domain/fechaDeHoy.ts'
import { Alerta } from '@/shared/ui/Alerta.tsx'
import { Boton } from '@/shared/ui/Boton.tsx'
import { mensajeDeError } from '@/shared/ui/mensajeDeError.ts'
import { AutorizacionDeDatos } from './AutorizacionDeDatos.tsx'
import { DatosDelComensal } from './DatosDelComensal.tsx'
import { TutorDelMenor } from './TutorDelMenor.tsx'
import { UsoDeImagen } from './UsoDeImagen.tsx'

const CLASES_TARJETA = 'rounded-lg border border-hairline bg-surface p-4 shadow-card'

function EsperaDeLaFicha() {
  return (
    <div aria-hidden="true" className={`flex animate-pulse flex-col gap-4 ${CLASES_TARJETA}`}>
      <span className="h-7 w-2/3 rounded-sm bg-surface-subtle" />
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

      <header className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="text-heading font-semibold text-ink">Ficha del comensal</h1>
          <p className="text-body text-ink-secondary">Padrón del comedor Pan para Todos</p>
        </div>
        <span className="mt-1 inline-flex shrink-0 items-center gap-1 rounded-sm bg-privacy-soft px-2 py-1 font-mono text-label font-medium text-privacy">
          <ShieldCheck aria-hidden="true" className="size-4" />
          Ley 1581
        </span>
      </header>

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

      {ficha.data && <DatosDelComensal beneficiario={ficha.data} className={CLASES_TARJETA} />}

      {ficha.data?.nivel === 'BASICO' && (
        <Link
          to={`/beneficiarios/${id}/completar`}
          className="inline-flex min-h-touch w-full items-center justify-center gap-2 rounded-md border border-border-input bg-surface px-6 py-2 text-body-lg font-semibold text-primary transition duration-150 ease-press hover:bg-surface-hover active:translate-y-px active:scale-99 md:w-auto md:self-end"
        >
          <PencilLine aria-hidden="true" className="size-5 shrink-0" />
          Completar datos extendidos
        </Link>
      )}

      {ficha.data && <AutorizacionDeDatos beneficiario={ficha.data} className={CLASES_TARJETA} />}

      {ficha.data && esMenorDeEdad(ficha.data.fechaNacimiento, fechaDeHoy()) && (
        <TutorDelMenor beneficiario={ficha.data} className={CLASES_TARJETA} />
      )}

      {ficha.data && <UsoDeImagen beneficiario={ficha.data} className={CLASES_TARJETA} />}
    </div>
  )
}
