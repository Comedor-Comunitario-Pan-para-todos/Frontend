import { ClipboardPen } from 'lucide-react'
import { useState } from 'react'
import type { PoliticaVigente } from '@/modules/beneficiarios/domain/politicaVigente.ts'
import { PoliticaTratamiento } from '@/modules/beneficiarios/ui/datosSensibles/PoliticaTratamiento.tsx'
import { Boton } from '@/shared/ui/Boton.tsx'
import { HojaInferior } from '@/shared/ui/HojaInferior.tsx'

interface PedirAutorizacionProps {
  readonly etiqueta: string
  readonly titulo: string
  readonly instruccion: string
  readonly politica: PoliticaVigente
  readonly confirmacion: string
  readonly guardando: boolean
  alConfirmar(): void
}

/** La política se explica en una hoja aparte, solo cuando se pide la autorización. */
export function PedirAutorizacion({
  etiqueta,
  titulo,
  instruccion,
  politica,
  confirmacion,
  guardando,
  alConfirmar,
}: PedirAutorizacionProps) {
  const [abierta, setAbierta] = useState(false)

  function confirmar() {
    setAbierta(false)
    alConfirmar()
  }

  return (
    <>
      <Boton
        variante="secundario"
        cargando={guardando}
        onClick={() => setAbierta(true)}
        className="w-full md:w-auto md:self-end"
      >
        {!guardando && <ClipboardPen aria-hidden="true" className="size-5 shrink-0" />}
        {etiqueta}
      </Boton>
      <HojaInferior abierta={abierta} titulo={titulo} alCerrar={() => setAbierta(false)}>
        <p className="text-body text-ink-secondary">{instruccion}</p>
        <PoliticaTratamiento politica={politica} />
        <div className="flex flex-col gap-3">
          <Boton onClick={confirmar}>{confirmacion}</Boton>
          <Boton variante="secundario" onClick={() => setAbierta(false)}>
            Cancelar
          </Boton>
        </div>
      </HojaInferior>
    </>
  )
}
