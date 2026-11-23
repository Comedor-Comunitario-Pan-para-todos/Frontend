import { fechaDeHoy } from '@/shared/domain/fechaDeHoy.ts'

export const MAYORIA_DE_EDAD = 18

type Fecha = readonly [anio: number, mes: number, dia: number]

function leerFecha(fecha: string): Fecha | null {
  const partes = fecha.split('-').map(Number)
  if (partes.length !== 3 || !partes.every(Number.isInteger)) return null

  const [anio, mes, dia] = partes
  if (mes < 1 || mes > 12 || dia < 1 || dia > 31) return null
  return [anio, mes, dia]
}

export function calcularEdad(fechaNacimiento: string, hoy: string): number | null {
  const nacimiento = leerFecha(fechaNacimiento)
  const actual = leerFecha(hoy)
  if (!nacimiento || !actual) return null

  const [anioNacimiento, mesNacimiento, diaNacimiento] = nacimiento
  const [anioHoy, mesHoy, diaHoy] = actual
  const yaCumplioEsteAnio =
    mesHoy > mesNacimiento || (mesHoy === mesNacimiento && diaHoy >= diaNacimiento)

  return anioHoy - anioNacimiento - (yaCumplioEsteAnio ? 0 : 1)
}

export function esMenorDeEdad(fechaNacimiento: string, hoy: string): boolean {
  const edad = calcularEdad(fechaNacimiento, hoy)
  return edad === null || edad < MAYORIA_DE_EDAD
}

export function eraMayorDeEdad(fechaNacimiento: string, momento: string): boolean {
  const edad = calcularEdad(fechaNacimiento, fechaDeHoy(new Date(momento)))
  return edad !== null && edad >= MAYORIA_DE_EDAD
}
