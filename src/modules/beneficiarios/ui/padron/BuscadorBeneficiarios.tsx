import { Search, X } from 'lucide-react'
import { useRef } from 'react'
import { CampoTexto } from '@/shared/ui/CampoTexto.tsx'

interface BuscadorBeneficiariosProps {
  readonly valor: string
  readonly alCambiar: (valor: string) => void
}

export function BuscadorBeneficiarios({ valor, alCambiar }: BuscadorBeneficiariosProps) {
  const campo = useRef<HTMLInputElement>(null)

  function borrar() {
    alCambiar('')
    // El foco vuelve al campo: quien borra casi siempre va a escribir otra búsqueda.
    campo.current?.focus()
  }

  return (
    <div role="search">
      <CampoTexto
        ref={campo}
        etiqueta="Buscar persona"
        placeholder="Nombre, apellido o documento"
        role="searchbox"
        enterKeyHint="search"
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        icono={Search}
        value={valor}
        onChange={(evento) => alCambiar(evento.target.value)}
        accion={
          valor !== '' && (
            <button
              type="button"
              aria-label="Borrar la búsqueda"
              onClick={borrar}
              className="absolute inset-y-0 right-0 flex w-touch items-center justify-center rounded-md text-ink-secondary transition duration-150 ease-press hover:text-ink"
            >
              <X aria-hidden="true" className="size-5" />
            </button>
          )
        }
      />
    </div>
  )
}
