import { X } from 'lucide-react'
import { useEffect, useId, useRef, type ReactNode } from 'react'

interface HojaInferiorProps {
  readonly abierta: boolean
  readonly titulo: string
  alCerrar(): void
  readonly children: ReactNode
}

/** En teléfono sube desde abajo; desde tablet es una ventana centrada. El contenido se monta al abrir. */
export function HojaInferior({ abierta, titulo, alCerrar, children }: HojaInferiorProps) {
  const dialogo = useRef<HTMLDialogElement>(null)
  const idTitulo = useId()

  useEffect(() => {
    const elemento = dialogo.current
    if (!elemento) return
    if (abierta && !elemento.open) elemento.showModal()
    if (!abierta && elemento.open) elemento.close()
  }, [abierta])

  return (
    <dialog
      ref={dialogo}
      aria-labelledby={idTitulo}
      onCancel={(evento) => {
        evento.preventDefault()
        alCerrar()
      }}
      className="mx-0 mt-auto mb-0 w-full max-w-full rounded-t-lg bg-surface px-6 pt-4 pb-safe text-ink shadow-raised backdrop:bg-surface-dark/50 md:m-auto md:max-w-narrow md:rounded-lg md:pb-6"
    >
      {abierta && (
        <div className="flex flex-col gap-4">
          <div className="flex items-start justify-between gap-3">
            <h2 id={idTitulo} className="pt-3 text-title font-semibold text-ink">
              {titulo}
            </h2>
            <button
              type="button"
              aria-label="Cerrar"
              onClick={alCerrar}
              className="-mr-3 flex size-touch shrink-0 items-center justify-center rounded-md text-ink-secondary transition duration-150 ease-press hover:bg-surface-hover"
            >
              <X aria-hidden="true" className="size-6" />
            </button>
          </div>
          {children}
        </div>
      )}
    </dialog>
  )
}
