import type { Beneficiario } from '@/modules/beneficiarios/domain/Beneficiario.ts'
import { POLITICA_IMAGEN } from '@/modules/beneficiarios/domain/politicaImagen.ts'
import { PoliticaTratamiento } from '@/modules/beneficiarios/ui/datosSensibles/PoliticaTratamiento.tsx'
import { Boton } from '@/shared/ui/Boton.tsx'
import { useAutorizarUsoDeImagen } from './useAutorizarUsoDeImagen.ts'

interface AutorizarUsoDeImagenProps {
  readonly beneficiario: Beneficiario
  readonly requiereTutor: boolean
  /** El texto que explica por qué el botón está deshabilitado. */
  readonly idExplicacion: string
}

export function AutorizarUsoDeImagen({
  beneficiario,
  requiereTutor,
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
        Le expliqué y autorizó las fotos
      </Boton>
    </>
  )
}
