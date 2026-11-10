import { LoaderCircle } from 'lucide-react'
import { Alerta } from '@/shared/ui/Alerta.tsx'
import { Boton } from '@/shared/ui/Boton.tsx'
import { mensajeDeError } from '@/shared/ui/mensajeDeError.ts'
import { TarjetaBeneficiario } from './TarjetaBeneficiario.tsx'
import type { Padron } from './usePadron.ts'

interface ResultadosPadronProps {
  readonly padron: Padron
}

const CLASES_LISTA = 'grid grid-cols-1 gap-3 md:grid-cols-2'
const TARJETAS_DE_ESPERA = [1, 2, 3, 4]
const MAXIMO_DE_SUGERENCIAS = 3

function contar(cantidad: number, singular: string, plural: string): string {
  return cantidad === 1 ? `1 ${singular}` : `${cantidad} ${plural}`
}

/** Lo que se le dice a la persona sobre lo que está viendo. Va en una región viva. */
function describir({ estado, buscando, total, textoBuscado }: Padron): string {
  if (estado === 'error') return ''
  if (estado === 'cargando') return 'Cargando el padrón…'
  if (buscando) return 'Buscando…'
  if (textoBuscado === '') {
    return total === 0
      ? 'Todavía no hay personas registradas.'
      : contar(total, 'persona en el padrón', 'personas en el padrón')
  }
  return total === 0
    ? `No encontramos a nadie con «${textoBuscado}».`
    : contar(total, 'resultado', 'resultados')
}

/**
 * El servidor busca dentro del nombre o del apellido, no en los dos juntos: "maría restrepo" no
 * encuentra a nadie. Se ofrece buscar cada palabra por separado para no registrar a alguien dos veces.
 */
function palabrasParaSugerir(texto: string): string[] {
  const palabras = [...new Set(texto.split(/\s+/).filter((palabra) => palabra.length >= 3))]
  return palabras.length > 1 ? palabras.slice(0, MAXIMO_DE_SUGERENCIAS) : []
}

function EsperaDelPadron() {
  return (
    <ul aria-hidden="true" className={CLASES_LISTA}>
      {TARJETAS_DE_ESPERA.map((tarjeta) => (
        <li
          key={tarjeta}
          className="flex animate-pulse items-start gap-3 rounded-lg border border-hairline bg-surface p-4"
        >
          <span className="size-12 shrink-0 rounded-md bg-surface-subtle" />
          <span className="flex flex-1 flex-col gap-2 pt-1">
            <span className="h-5 w-2/3 rounded-sm bg-surface-subtle" />
            <span className="h-4 w-1/2 rounded-sm bg-surface-subtle" />
          </span>
        </li>
      ))}
    </ul>
  )
}

function AyudaSinResultados({ padron }: ResultadosPadronProps) {
  const palabras = palabrasParaSugerir(padron.textoBuscado)

  if (palabras.length === 0) {
    return (
      <p className="text-body text-ink-secondary">
        Revise cómo está escrito o pruebe con el número de documento.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-body text-ink-secondary">
        Busque con un solo dato a la vez: un nombre, un apellido o el documento.
      </p>
      <div className="flex flex-wrap gap-2">
        {palabras.map((palabra) => (
          <Boton key={palabra} variante="secundario" onClick={() => padron.cambiarTexto(palabra)}>
            Buscar «{palabra}»
          </Boton>
        ))}
      </div>
    </div>
  )
}

function ListaDelPadron({ padron }: ResultadosPadronProps) {
  const { beneficiarios, total, buscando } = padron

  return (
    <>
      <ul
        aria-busy={buscando || undefined}
        className={`${CLASES_LISTA} transition-opacity duration-150 ${buscando ? 'opacity-60' : ''}`}
      >
        {beneficiarios.map((beneficiario) => (
          <li key={beneficiario.id}>
            <TarjetaBeneficiario beneficiario={beneficiario} />
          </li>
        ))}
      </ul>

      {padron.hayMas && (
        <div className="flex flex-col items-center gap-3">
          <p className="text-label text-ink-secondary">
            Mostrando {beneficiarios.length} de {total}
          </p>
          {padron.falloAlCargarMas && (
            <Alerta tipo="peligro">{mensajeDeError(padron.error)}</Alerta>
          )}
          <Boton
            variante="secundario"
            cargando={padron.cargandoMas}
            onClick={padron.cargarMas}
            className="w-full md:w-auto"
          >
            Ver más personas
          </Boton>
        </div>
      )}
    </>
  )
}

export function ResultadosPadron({ padron }: ResultadosPadronProps) {
  const { estado, buscando, total, textoBuscado } = padron
  const sinResultados = estado === 'listo' && !buscando && total === 0
  const descripcion = describir(padron)

  return (
    <section aria-label="Personas del padrón" className="flex flex-col gap-4">
      {/* La región viva existe siempre; cuando no hay nada que decir no ocupa espacio. */}
      <p
        role="status"
        className={
          descripcion === ''
            ? 'sr-only'
            : 'flex min-h-6 items-center gap-2 text-body text-ink-secondary'
        }
      >
        {buscando && estado !== 'error' && (
          <LoaderCircle aria-hidden="true" className="size-4 shrink-0 animate-spin" />
        )}
        {descripcion}
      </p>

      {estado === 'cargando' && <EsperaDelPadron />}

      {estado === 'error' && (
        <>
          <Alerta tipo="peligro" titulo="No pudimos cargar el padrón">
            {mensajeDeError(padron.error)}
          </Alerta>
          <Boton onClick={padron.reintentar}>Reintentar</Boton>
        </>
      )}

      {estado === 'listo' && total > 0 && <ListaDelPadron padron={padron} />}

      {sinResultados && textoBuscado !== '' && <AyudaSinResultados padron={padron} />}
    </section>
  )
}
