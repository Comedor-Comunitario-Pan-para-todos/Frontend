const FECHA_CALENDARIO = /^(\d{4})-(\d{2})-(\d{2})$/

/**
 * Muestra una fecha de calendario `AAAA-MM-DD` como `DD/MM/AAAA`. Trabaja con el texto, sin
 * `Date`: una fecha de nacimiento no tiene hora ni zona horaria que la puedan correr un día.
 */
export function formatearFechaCalendario(fecha: string): string {
  const partes = FECHA_CALENDARIO.exec(fecha)
  if (!partes) return fecha

  const [, anio, mes, dia] = partes
  return `${dia}/${mes}/${anio}`
}
