import type { Beneficiario } from '@/modules/beneficiarios/domain/Beneficiario.ts'
import { POLITICA_IMAGEN } from '@/modules/beneficiarios/domain/politicaImagen.ts'
import { PedirAutorizacion } from './PedirAutorizacion.tsx'
import { useAutorizarUsoDeImagen } from './useAutorizarUsoDeImagen.ts'

interface AutorizarUsoDeImagenProps {
  readonly beneficiario: Beneficiario
  readonly porElTutor: boolean
}

export function AutorizarUsoDeImagen({ beneficiario, porElTutor }: AutorizarUsoDeImagenProps) {
  const { autorizar, autorizando } = useAutorizarUsoDeImagen()

  return (
    <PedirAutorizacion
      etiqueta="Pedir autorización de fotos"
      titulo="Autorización de fotos"
      instruccion={
        porElTutor
          ? 'Explíquele al tutor la política de imagen. Si está de acuerdo, registre la autorización.'
          : 'Explíquele la política de imagen. Si está de acuerdo, registre su autorización.'
      }
      politica={POLITICA_IMAGEN}
      confirmacion={
        porElTutor
          ? 'Le expliqué al tutor y autorizó las fotos'
          : 'Le expliqué y autorizó las fotos'
      }
      guardando={autorizando}
      alConfirmar={() => autorizar(beneficiario)}
    />
  )
}
