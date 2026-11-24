/** "315 123-4567" y "3151234567" son el mismo número: se guarda sin separadores. */
export function normalizarTelefono(telefono: string): string {
  return telefono.replace(/[\s.()-]/g, '')
}

/** Fijo de 7 dígitos o celular de 10. Recibe el número ya normalizado. */
export function esTelefonoValido(telefono: string): boolean {
  return /^\d{7,10}$/.test(telefono)
}
