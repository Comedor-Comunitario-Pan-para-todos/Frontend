import type { Beneficiario } from '@/modules/beneficiarios/domain/Beneficiario.ts'
import { POLITICA_IMAGEN } from '@/modules/beneficiarios/domain/politicaImagen.ts'
import { PoliticaTratamiento } from '@/modules/beneficiarios/ui/datosSensibles/PoliticaTratamiento.tsx'
import { Boton } from '@/shared/ui/Boton.tsx'
import { useAutorizarUsoDeImagen } from './useAutorizarUsoDeImagen.ts'

interface AutorizarUsoDeImagenProps {
  readonly beneficiario: Beneficiario
  readonly requiereTutor: boolean
  readonly porElTutor: boolean
  readonly idExplicacion: string
}

export function AutorizarUsoDeImagen({
  beneficiario,
  requiereTutor,
  porElTutor,
  idExplicacion,
}: AutorizarUsoDeImagenProps) {
  const { autorizar, autorizando } = useAutorizarUsoDeImagen()

  return (
    <>
      {!requiereTutor && <PoliticaTratamiento politica={POLITICA_IMAGEN} />}
      <Boton
        cargando={autorizando}
        disabled={requiereTutor}
        aria-describedby={requiereTutor ? idExplicacion : undefined}
        onClick={() => autorizar(beneficiario)}
        className="w-full md:w-auto md:self-end"
      >
        {porElTutor
          ? 'Le expliqué al tutor y autorizó las fotos'
          : 'Le expliqué y autorizó las fotos'}
      </Boton>
    </>
  )
}
