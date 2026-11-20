import { formatearFechaCalendario } from '@/modules/beneficiarios/index.ts'
import type {
  ErrorFechaDesde,
  ErrorFechaHasta,
  RangoFechas,
} from '@/modules/reportes/domain/RangoFechas.ts'

export function textoDelRango({ desde, hasta }: RangoFechas): string {
  return `${formatearFechaCalendario(desde)} – ${formatearFechaCalendario(hasta)}`
}

export function textoDePersonas(cantidad: number): string {
  return cantidad === 1 ? '1 persona' : `${cantidad} personas`
}

const MENSAJES_DESDE: Record<ErrorFechaDesde, string> = {
  vacia: 'Indique la fecha de inicio.',
  invalida: 'Escriba una fecha válida.',
  futura: 'La fecha no puede ser posterior a hoy.',
  'posterior-a-hasta': 'Debe ser anterior o igual a la fecha final.',
}

const MENSAJES_HASTA: Record<ErrorFechaHasta, string> = {
  vacia: 'Indique la fecha final.',
  invalida: 'Escriba una fecha válida.',
  futura: 'La fecha no puede ser posterior a hoy.',
}

export function mensajeErrorDesde(error: ErrorFechaDesde | undefined): string | undefined {
  return error === undefined ? undefined : MENSAJES_DESDE[error]
}

export function mensajeErrorHasta(error: ErrorFechaHasta | undefined): string | undefined {
  return error === undefined ? undefined : MENSAJES_HASTA[error]
}
