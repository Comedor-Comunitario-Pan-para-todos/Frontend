import { LoaderCircle } from 'lucide-react'
import { useEffect, useState } from 'react'

interface PantallaCargaProps {
  readonly mensaje?: string
}

// Si la carga termina antes de este tiempo, no aparece nada y se evita el parpadeo.
const RETRASO_MS = 200

export function PantallaCarga({ mensaje = 'Cargando' }: PantallaCargaProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const temporizador = setTimeout(() => setVisible(true), RETRASO_MS)
    return () => clearTimeout(temporizador)
  }, [])

  return (
    <div
      role="status"
      className="flex min-h-svh flex-col items-center justify-center gap-3 px-gutter"
    >
      {visible && (
        <>
          <LoaderCircle aria-hidden="true" className="size-8 animate-spin text-brand" />
          <p className="text-body text-ink-secondary">{mensaje}</p>
        </>
      )}
    </div>
  )
}
