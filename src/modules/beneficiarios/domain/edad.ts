const MAYORIA_DE_EDAD = 18

function separarFecha(fecha: string) {
  const partes = fecha.split('-')
  return {
    anio: Number(partes[0]),
    mes: Number(partes[1]),
    dia: Number(partes[2]),
  }
}

export function calcularEdad(fechaNacimiento: string, fechaHoy: string): number {
  const nacimiento = separarFecha(fechaNacimiento)
  const hoy = separarFecha(fechaHoy)

  let edad = hoy.anio - nacimiento.anio

  const yaCumplioEsteAnio =
    hoy.mes > nacimiento.mes || (hoy.mes === nacimiento.mes && hoy.dia >= nacimiento.dia)

  if (!yaCumplioEsteAnio) {
    edad = edad - 1
  }

  return edad
}

export function esMenorDeEdad(fechaNacimiento: string, fechaHoy: string): boolean {
  return calcularEdad(fechaNacimiento, fechaHoy) < MAYORIA_DE_EDAD
}
