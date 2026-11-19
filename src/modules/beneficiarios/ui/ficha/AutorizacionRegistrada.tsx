import { CircleCheck } from 'lucide-react'
import type { Consentimiento } from '@/modules/beneficiarios/domain/Consentimiento.ts'
import { Dato } from './Dato.tsx'

interface AutorizacionRegistradaProps {
  readonly consentimiento: Consentimiento
}

function formatearFechaYHora(momento: string): string {
  return new Date(momento).toLocaleString('es-CO', {
    timeZone: 'America/Bogota',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

/** Lo que se necesita para auditar la autorización: cuándo, quién la tomó y qué texto (RNF-09). */
export function AutorizacionRegistrada({ consentimiento }: AutorizacionRegistradaProps) {
  const { registradoEn, registradoPor, versionPolitica } = consentimiento

  return (
    <>
      <span className="inline-flex items-center gap-1 self-start rounded-pill bg-success-soft px-3 py-1 text-label font-medium text-success">
        <CircleCheck aria-hidden="true" className="size-4 shrink-0" />
        Autorizó el uso de sus datos
      </span>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
        <Dato nombre="Fecha" ancho>
          <span className="font-mono">{formatearFechaYHora(registradoEn)}</span>
        </Dato>
        <Dato nombre="Tomada por">{registradoPor}</Dato>
        <Dato nombre="Política">
          <span className="font-mono">Versión {versionPolitica}</span>
        </Dato>
      </dl>
    </>
  )
}
