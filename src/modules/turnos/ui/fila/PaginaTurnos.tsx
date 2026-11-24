import { Search, UserPlus } from 'lucide-react'
import { useRef, useState } from 'react'
import { Link } from 'react-router'
import { usePermiso } from '@/modules/auth/index.ts'
import {
  BuscadorBeneficiarios,
  nombreCompleto,
  usePadron,
  type Beneficiario,
} from '@/modules/beneficiarios/index.ts'
import { esJornadaNoDisponible } from '@/modules/turnos/domain/JornadaNoDisponible.ts'
import type { Turno } from '@/modules/turnos/domain/Turno.ts'
import { esTurnoYaEntregado } from '@/modules/turnos/domain/TurnoYaEntregado.ts'
import { formatearNumeroTurno, turnoDeLaPersona } from '@/modules/turnos/domain/turnosDelDia.ts'
import { Alerta } from '@/shared/ui/Alerta.tsx'
import { Boton } from '@/shared/ui/Boton.tsx'
import { useConstancia } from '@/shared/ui/constancia/contextoConstancia.ts'
import { formatearHora } from './formatearHora.ts'
import { ListaTurnosHoy } from './ListaTurnosHoy.tsx'
import { PersonaSinTurno } from './PersonaSinTurno.tsx'
import { ResultadosBusqueda } from './ResultadosBusqueda.tsx'
import { TiqueteTurno } from './TiqueteTurno.tsx'
import { useEntregarTurno } from './useEntregarTurno.ts'
import { useTurnosDeHoy } from './useTurnosDeHoy.ts'

function BotonOtraPersona({ alPresionar }: { readonly alPresionar: () => void }) {
  return (
    <Boton variante="secundario" onClick={alPresionar} className="w-full">
      <Search aria-hidden="true" className="size-5" />
      Buscar a otra persona
    </Boton>
  )
}

function YaTieneTurno({ turno }: { readonly turno: Turno }) {
  const { nombreCompleto: nombre } = turno.beneficiario

  return (
    <>
      <Alerta tipo="peligro" titulo={`${nombre} ya tiene turno hoy`}>
        El {formatearNumeroTurno(turno.numero)} se le entregó a las{' '}
        {formatearHora(turno.entregadoEn)} y no se entrega un segundo turno el mismo día. Si lo
        perdió, muéstrele este número otra vez.
      </Alerta>
      <TiqueteTurno turno={turno} encabezado="Turno ya entregado hoy" />
    </>
  )
}

/** Turnos de la fila (RF-03): buscar a la persona en el padrón y entregarle su número del día. */
export function PaginaTurnos() {
  const padron = usePadron()
  const turnosDeHoy = useTurnosDeHoy()
  const entrega = useEntregarTurno()
  const constancia = useConstancia()
  const puedeRegistrar = usePermiso('beneficiarios.registrar')
  const [persona, setPersona] = useState<Beneficiario | null>(null)
  // El turno que se acaba de entregar en esta pantalla, para mostrarlo como recién entregado.
  const [idEntregado, setIdEntregado] = useState<string | null>(null)
  const zonaBuscador = useRef<HTMLDivElement>(null)

  const turnos = turnosDeHoy.data ?? []
  const turnoDePersona = persona ? turnoDeLaPersona(turnos, persona.id) : null

  function empezarDeNuevo(texto: string) {
    padron.cambiarTexto(texto)
    setPersona(null)
    setIdEntregado(null)
    entrega.reset()
    constancia.cerrar()
  }

  function atenderAOtraPersona() {
    empezarDeNuevo('')
    // Quien termina con una persona va a escribir el nombre de la siguiente.
    zonaBuscador.current?.querySelector('input')?.focus()
  }

  function elegir(beneficiario: Beneficiario) {
    setPersona(beneficiario)
    setIdEntregado(null)
    entrega.reset()
  }

  function entregar(beneficiario: Beneficiario) {
    const nombre = nombreCompleto(beneficiario)
    entrega.mutate(beneficiario.id, {
      onSuccess: (turno) => {
        const numero = formatearNumeroTurno(turno.numero)
        setIdEntregado(turno.id)
        constancia.confirmar({
          titulo: `Turno ${numero} entregado`,
          detalle: `${nombre} queda en espera.`,
          resumen: `Turno ${numero} entregado a ${nombre}`,
        })
      },
      onError: (error) => {
        // Estos dos casos se explican en la pantalla: no se arreglan reintentando.
        if (esTurnoYaEntregado(error) || esJornadaNoDisponible(error)) return
        constancia.avisarFallo({
          titulo: 'No se entregó el turno',
          detalle: `${nombre} sigue sin turno. Revise su conexión e inténtelo de nuevo.`,
          reintentar: () => entregar(beneficiario),
        })
      },
    })
  }

  return (
    <div className="mx-auto flex w-full max-w-content flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-heading font-semibold text-ink">Turnos de hoy</h1>
        <p className="text-body text-ink-secondary">
          Busque a la persona en el padrón y entréguele su número.
        </p>
      </header>

      <div ref={zonaBuscador} className="flex flex-col gap-2">
        <BuscadorBeneficiarios valor={padron.texto} alCambiar={empezarDeNuevo} />
        {puedeRegistrar && (
          <Link
            to="/beneficiarios/nuevo"
            className="inline-flex min-h-touch items-center gap-2 self-start rounded-md text-body font-semibold text-primary transition duration-150 ease-press hover:text-primary-hover"
          >
            <UserPlus aria-hidden="true" className="size-5 shrink-0" />
            ¿No está en el padrón? Regístrela
          </Link>
        )}
      </div>

      {!persona && padron.texto.trim() !== '' && (
        <ResultadosBusqueda padron={padron} turnosDeHoy={turnos} alElegir={elegir} />
      )}

      {persona && (
        <section aria-label="Turno de la persona elegida" className="flex flex-col gap-4">
          {turnoDePersona && turnoDePersona.id === idEntregado && (
            <TiqueteTurno turno={turnoDePersona} encabezado="Turno de hoy" />
          )}
          {turnoDePersona && turnoDePersona.id !== idEntregado && (
            <YaTieneTurno turno={turnoDePersona} />
          )}
          {!turnoDePersona && (
            <PersonaSinTurno
              beneficiario={persona}
              confirmadoSinTurno={turnosDeHoy.isSuccess}
              entregando={entrega.isPending}
              jornadaNoDisponible={esJornadaNoDisponible(entrega.error)}
              alEntregar={() => entregar(persona)}
            />
          )}
          {turnoDePersona && <BotonOtraPersona alPresionar={atenderAOtraPersona} />}
        </section>
      )}

      <ListaTurnosHoy consulta={turnosDeHoy} />
    </div>
  )
}
