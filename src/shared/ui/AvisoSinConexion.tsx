import { WifiOff } from 'lucide-react'
import { useSyncExternalStore } from 'react'

function suscribir(alCambiar: () => void) {
  window.addEventListener('online', alCambiar)
  window.addEventListener('offline', alCambiar)
  return () => {
    window.removeEventListener('online', alCambiar)
    window.removeEventListener('offline', alCambiar)
  }
}

function estaEnLinea() {
  return navigator.onLine
}

export function AvisoSinConexion() {
  const enLinea = useSyncExternalStore(suscribir, estaEnLinea)

  return (
    <div role="status" className="sticky top-0 z-20">
      {!enLinea && (
        <p className="flex items-center justify-center gap-2 bg-surface-dark px-gutter pt-safe pb-1 text-body font-medium text-ink-inverse">
          <WifiOff aria-hidden="true" className="size-5" />
          Sin conexión. No se puede guardar.
        </p>
      )}
    </div>
  )
}
