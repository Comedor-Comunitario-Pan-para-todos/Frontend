import { Camera, CameraOff, UsersRound, type LucideIcon } from 'lucide-react'
import type { EstadoUsoImagen } from '@/modules/beneficiarios/domain/estadoUsoImagen.ts'

interface InsigniaUsoImagenProps {
  readonly estado: EstadoUsoImagen
}

const ESTILOS: Record<EstadoUsoImagen, { texto: string; icono: LucideIcon; clases: string }> = {
  AUTORIZADA: {
    texto: 'Foto autorizada',
    icono: Camera,
    clases: 'bg-success-soft text-success',
  },
  NO_AUTORIZADA: {
    texto: 'Rostro no fotografiable',
    icono: CameraOff,
    clases: 'bg-privacy-soft text-privacy',
  },
  REQUIERE_TUTOR: {
    texto: 'Requiere autorización del tutor',
    icono: UsersRound,
    clases: 'bg-privacy-soft text-privacy',
  },
}

export function InsigniaUsoImagen({ estado }: InsigniaUsoImagenProps) {
  const { texto, icono: Icono, clases } = ESTILOS[estado]

  return (
    <span
      className={`inline-flex items-center gap-1 self-start rounded-pill px-3 py-1 text-label font-medium ${clases}`}
    >
      <Icono aria-hidden="true" className="size-4 shrink-0" />
      {texto}
    </span>
  )
}
