import { Camera, CameraOff, UsersRound } from 'lucide-react'
import type { EstadoUsoImagen } from '@/modules/beneficiarios/domain/estadoUsoImagen.ts'
import type { EstadoDeAutorizacion } from './FilaAutorizacion.tsx'

export const ESTADO_DE_IMAGEN: Record<EstadoUsoImagen, EstadoDeAutorizacion> = {
  AUTORIZADA: { texto: 'Foto autorizada', icono: Camera, tono: 'exito' },
  NO_AUTORIZADA: { texto: 'Rostro no fotografiable', icono: CameraOff, tono: 'privacidad' },
  REQUIERE_TUTOR: {
    texto: 'Requiere autorización del tutor',
    icono: UsersRound,
    tono: 'privacidad',
  },
}
