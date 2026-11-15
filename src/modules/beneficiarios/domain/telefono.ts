/** "315 123-4567" y "3151234567" son el mismo número: se guarda sin separadores. */
export function normalizarTelefono(telefono: string): string {
  return telefono.replace(/[\s.()-]/g, '')
}
