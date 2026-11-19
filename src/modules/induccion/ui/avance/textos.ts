export function textoDeTemas(cantidad: number): string {
  return cantidad === 1 ? '1 tema' : `${cantidad} temas`
}

export function textoDeMinutos(cantidad: number): string {
  return cantidad === 1 ? '1 minuto' : `${cantidad} minutos`
}
