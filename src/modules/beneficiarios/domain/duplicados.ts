import { nombreCompleto, type Beneficiario } from './Beneficiario.ts'

type DatosDeIdentidad = Pick<Beneficiario, 'nombres' | 'apellidos' | 'fechaNacimiento'>

const TILDES = /[̀-ͯ]/g

/** "  María   JOSÉ " y "maria jose" se comparan como el mismo nombre. */
export function normalizarNombre(nombre: string): string {
  return nombre.normalize('NFD').replace(TILDES, '').toLowerCase().replace(/\s+/g, ' ').trim()
}

/**
 * Sin documento, dos fichas son la misma persona si coinciden el nombre completo y la fecha de
 * nacimiento (RNF-15). Es un aviso para quien registra, no un bloqueo: decide la persona.
 */
export function esPosibleDuplicado(candidato: DatosDeIdentidad, existente: DatosDeIdentidad) {
  return (
    candidato.fechaNacimiento === existente.fechaNacimiento &&
    normalizarNombre(nombreCompleto(candidato)) === normalizarNombre(nombreCompleto(existente))
  )
}
