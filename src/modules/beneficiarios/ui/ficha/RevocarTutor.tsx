import { useState, type FormEvent } from 'react'
import type { Beneficiario } from '@/modules/beneficiarios/domain/Beneficiario.ts'
import { Boton } from '@/shared/ui/Boton.tsx'
import { CampoAreaTexto } from '@/shared/ui/CampoAreaTexto.tsx'
import { useRevocarTutor } from './useRevocarTutor.ts'

// Límite del contrato (docs/CONSENTIMIENTOS.md, 6.2).
const MAXIMO_MOTIVO = 255

interface RevocarTutorProps {
  readonly beneficiario: Beneficiario
  readonly nombreTutor: string
}

export function RevocarTutor({ beneficiario, nombreTutor }: RevocarTutorProps) {
  const { revocar, revocando } = useRevocarTutor()
  const [abierto, setAbierto] = useState(false)
  const [motivo, setMotivo] = useState('')
  const [error, setError] = useState<string>()

  if (!abierto) {
    return (
      <Boton
        variante="suave"
        onClick={() => setAbierto(true)}
        className="w-full md:w-60 md:self-end"
      >
        Revocar al tutor
      </Boton>
    )
  }

  function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    if (motivo.trim() === '') {
      setError('Escriba por qué se revoca al tutor.')
      return
    }
    revocar({ ficha: beneficiario, nombreTutor, motivo })
  }

  function cancelar() {
    setAbierto(false)
    setMotivo('')
    setError(undefined)
  }

  return (
    <form onSubmit={enviar} noValidate className="flex flex-col gap-3">
      <CampoAreaTexto
        etiqueta="Motivo de la revocación"
        value={motivo}
        maxLength={MAXIMO_MOTIVO}
        error={error}
        autoFocus
        onChange={(evento) => {
          setMotivo(evento.target.value)
          setError(undefined)
        }}
      />
      <div className="flex flex-col-reverse gap-2 md:flex-row md:justify-end">
        <Boton variante="secundario" onClick={cancelar}>
          Cancelar
        </Boton>
        <Boton type="submit" cargando={revocando}>
          Revocar al tutor
        </Boton>
      </div>
    </form>
  )
}
