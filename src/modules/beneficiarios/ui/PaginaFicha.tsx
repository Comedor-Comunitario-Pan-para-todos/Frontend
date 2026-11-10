import { ArrowLeft, ShieldCheck } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link, useParams } from 'react-router'
import { usePermiso } from '@/modules/auth/index.ts'
import { nombreCompleto, type Beneficiario } from '@/modules/beneficiarios/domain/Beneficiario.ts'
import { formatearFechaCalendario } from '@/modules/beneficiarios/domain/fechaCalendario.ts'
import { esErrorApi } from '@/shared/application/errores/ErrorApi.ts'
import { Alerta } from '@/shared/ui/Alerta.tsx'
import { Boton } from '@/shared/ui/Boton.tsx'
import { mensajeDeError } from '@/shared/ui/mensajeDeError.ts'
import { DocumentoBeneficiario } from './DocumentoBeneficiario.tsx'
import { useBeneficiario } from './useBeneficiario.ts'

const CLASES_TARJETA = 'rounded-lg border border-hairline bg-surface p-4 shadow-card'

function formatearMomento(momento: string): string {
  return new Date(momento).toLocaleDateString('es-CO', {
    timeZone: 'America/Bogota',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

interface DatoProps {
  readonly nombre: string
  readonly children: ReactNode
}

function Dato({ nombre, children }: DatoProps) {
  return (
    <div className="flex min-w-0 flex-col">
      <dt className="text-label text-ink-muted">{nombre}</dt>
      <dd className="text-body break-words text-ink">{children}</dd>
    </div>
  )
}

function DatosDelComensal({ beneficiario }: { readonly beneficiario: Beneficiario }) {
  const puedeVerTelefono = usePermiso('beneficiarios.verDatosSensibles')
  const { documento, fechaNacimiento, barrio, telefono, registradoEn } = beneficiario

  return (
    <article className={`flex flex-col gap-4 ${CLASES_TARJETA}`}>
      <h2 className="text-title font-semibold break-words text-ink">
        {nombreCompleto(beneficiario)}
      </h2>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
        <Dato nombre="Documento">
          <DocumentoBeneficiario documento={documento} />
        </Dato>
        <Dato nombre="Nacimiento">
          <span className="font-mono">{formatearFechaCalendario(fechaNacimiento)}</span>
        </Dato>
        <Dato nombre="Barrio">{barrio ?? 'Sin registrar'}</Dato>
        {puedeVerTelefono && (
          <Dato nombre="Teléfono">
            {telefono ? <span className="font-mono">{telefono}</span> : 'Sin registrar'}
          </Dato>
        )}
        <Dato nombre="En el padrón desde">
          <span className="font-mono">{formatearMomento(registradoEn)}</span>
        </Dato>
      </dl>
    </article>
  )
}

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

      {ficha.data && <DatosDelComensal beneficiario={ficha.data} />}
    </div>
  )
}
