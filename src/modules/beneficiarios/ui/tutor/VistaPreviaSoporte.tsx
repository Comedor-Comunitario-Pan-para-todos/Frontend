import { FileText, RefreshCw } from 'lucide-react'
import { formatearTamano } from '@/modules/beneficiarios/domain/tamanoArchivo.ts'
import { Boton } from '@/shared/ui/Boton.tsx'
import { useImagenTemporal } from './useImagenTemporal.ts'

interface VistaPreviaSoporteProps {
  readonly archivo: File
  readonly alQuitar: () => void
}

/** El soporte ya elegido: la foto (un PDF no tiene vista previa), su nombre y lo que pesa. */
export function VistaPreviaSoporte({ archivo, alQuitar }: VistaPreviaSoporteProps) {
  const imagen = useImagenTemporal(archivo)
  const esFoto = archivo.type.startsWith('image/')

  return (
    <div className="flex flex-col gap-3 rounded-md border border-hairline bg-surface-subtle p-3">
      {esFoto ? (
        <img
          ref={imagen}
          alt="Vista previa del papel firmado"
          className="max-h-80 w-full rounded-sm bg-surface object-contain"
        />
      ) : (
        <FileText aria-hidden="true" className="size-10 text-ink-muted" />
      )}
      <div className="flex min-w-0 flex-col">
        <span className="truncate text-body text-ink">{archivo.name}</span>
        <span className="font-mono text-label text-ink-muted">{formatearTamano(archivo.size)}</span>
      </div>
      <Boton variante="secundario" onClick={alQuitar} className="w-full sm:w-auto sm:self-start">
        <RefreshCw aria-hidden="true" className="size-5 shrink-0" />
        Cambiar el soporte
      </Boton>
    </div>
  )
}
