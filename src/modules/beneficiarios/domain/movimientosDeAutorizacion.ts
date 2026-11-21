import type { RegistroConsentimiento } from './RegistroConsentimiento.ts'

export interface MovimientoDeAutorizacion {
  readonly tipo: 'AUTORIZO' | 'RETIRO'
  readonly momento: string
  readonly usuario: string
}

function autorizacion(registro: RegistroConsentimiento): MovimientoDeAutorizacion {
  return { tipo: 'AUTORIZO', momento: registro.registradoEn, usuario: registro.registradoPor }
}

function retiro(registro: RegistroConsentimiento): MovimientoDeAutorizacion | null {
  if (registro.revocadoEn === null) return null
  return { tipo: 'RETIRO', momento: registro.revocadoEn, usuario: registro.revocadoPor ?? '' }
}

function movimientosDeUnRegistro(registro: RegistroConsentimiento): MovimientoDeAutorizacion[] {
  const retirada = retiro(registro)
  return retirada ? [retirada, autorizacion(registro)] : [autorizacion(registro)]
}

function masRecientePrimero(a: MovimientoDeAutorizacion, b: MovimientoDeAutorizacion): number {
  return Date.parse(b.momento) - Date.parse(a.momento)
}

/** Cada autorización y cada retiro como un movimiento aparte, el más reciente primero. */
export function movimientosDeAutorizacion(
  historial: readonly RegistroConsentimiento[],
): MovimientoDeAutorizacion[] {
  return historial.flatMap(movimientosDeUnRegistro).sort(masRecientePrimero)
}
