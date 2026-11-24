import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useDependencias } from '@/app/contextoDependencias.ts'
import type { Turno } from '@/modules/turnos/domain/Turno.ts'
import { esTurnoYaEntregado } from '@/modules/turnos/domain/TurnoYaEntregado.ts'
import { recientesPrimero } from '@/modules/turnos/domain/turnosDelDia.ts'
import { CLAVE_TURNOS_DE_HOY } from './useTurnosDeHoy.ts'

function conTurno(turnos: Turno[] | undefined, turno: Turno): Turno[] | undefined {
  return turnos && recientesPrimero([turno, ...turnos.filter(({ id }) => id !== turno.id)])
}

/**
 * Entrega el turno y lo pone de una vez en la lista de hoy. Si la persona ya tenía uno, también lo
 * agrega: así la pantalla muestra el turno que ya tenía aunque la lista no lo hubiera traído aún.
 */
export function useEntregarTurno() {
  const { entregarTurno } = useDependencias()
  const consultas = useQueryClient()

  function agregar(turno: Turno) {
    consultas.setQueryData<Turno[]>(CLAVE_TURNOS_DE_HOY, (turnos) => conTurno(turnos, turno))
  }

  return useMutation({
    mutationFn: (idBeneficiario: string) => entregarTurno(idBeneficiario),
    onSuccess: agregar,
    onError: (error) => {
      if (esTurnoYaEntregado(error)) agregar(error.turno)
    },
    // Otros voluntarios también entregan turnos: se vuelve a pedir la lista para verlos.
    onSettled: () => consultas.invalidateQueries({ queryKey: CLAVE_TURNOS_DE_HOY }),
  })
}
