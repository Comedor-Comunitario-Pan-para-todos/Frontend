import { ArrowLeft } from 'lucide-react'
import { Link, useParams } from 'react-router'
import { nombreCompleto } from '@/modules/beneficiarios/domain/Beneficiario.ts'
import { esMenorDeEdad } from '@/modules/beneficiarios/domain/edad.ts'
import { useBeneficiario } from '@/modules/beneficiarios/ui/beneficiario/useBeneficiario.ts'
import { fechaDeHoy } from '@/shared/domain/fechaDeHoy.ts'
import { Alerta } from '@/shared/ui/Alerta.tsx'
import { Boton } from '@/shared/ui/Boton.tsx'
import { mensajeDeError } from '@/shared/ui/mensajeDeError.ts'
import { FormularioTutor } from './FormularioTutor.tsx'

export function PaginaTutor() {
  const { id = '' } = useParams()
  const ficha = useBeneficiario(id)
  const menor = ficha.data && esMenorDeEdad(ficha.data.fechaNacimiento, fechaDeHoy())
  const tieneTutor = ficha.data?.autorizacionTutor?.estado === 'ACTIVA'

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
        <h1 className="text-heading font-semibold text-ink">Aprobar al tutor</h1>
        {ficha.data && (
          <p className="text-body wrap-break-word text-ink-secondary">
            Del menor {nombreCompleto(ficha.data)}
          </p>
        )}
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

      {ficha.data && !menor && (
        <Alerta tipo="aviso" titulo="Esta persona ya es mayor de edad">
          Ella misma autoriza el uso de su imagen desde la ficha.
        </Alerta>
      )}

      {ficha.data && menor && tieneTutor && (
        <Alerta tipo="aviso" titulo="Este menor ya tiene un tutor aprobado">
          Para cambiarlo, primero revoque el actual desde la ficha.
        </Alerta>
      )}

      {ficha.data && menor && !tieneTutor && (
        <>
          <Alerta tipo="privacidad" titulo="Protección de la imagen del menor">
            Con este papel, el tutor autoriza que el comedor use fotos del menor. No es requisito
            para recibir la ración.
          </Alerta>
          <FormularioTutor ficha={ficha.data} />
        </>
      )}
    </div>
  )
}
