const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function esUuid(valor: string): boolean {
  return UUID.test(valor)
}

export function texto(valor: unknown): string {
  return typeof valor === 'string' ? valor.trim() : ''
}

export function esCargaDePagina(request: Request): boolean {
  return request.headers.get('Accept')?.includes('text/html') ?? false
}
