import type { Turno } from '@/modules/turnos/domain/Turno.ts'

export function turnoDe(numero: number, idBeneficiario: string, nombreCompleto: string): Turno {
  return {
    id: `turno-${numero}`,
    numero,
    beneficiario: { id: idBeneficiario, nombreCompleto },
    entregadoEn: '2026-11-24T16:58:00.000Z',
    estado: 'EN_ESPERA',
  }
}

export const TURNO_JORGE = turnoDe(42, 'ben-jorge', 'Jorge Iván Cardona')
export const TURNO_LUZ = turnoDe(41, 'ben-luz', 'Luz Dary Ospina')
export const TURNO_CARLOS = turnoDe(40, 'ben-carlos', 'Carlos Andrés Mejía')
