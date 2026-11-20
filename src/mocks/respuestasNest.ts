import { HttpResponse } from 'msw'

export function errorNest(estado: number, mensaje: string | string[], error: string) {
  return HttpResponse.json({ statusCode: estado, message: mensaje, error }, { status: estado })
}

export function solicitudInvalida(mensajes: string | string[]) {
  return errorNest(400, mensajes, 'Bad Request')
}

export function idInvalido() {
  return solicitudInvalida('Validation failed (uuid is expected)')
}

export function beneficiarioNoEncontrado(id: string) {
  return errorNest(404, `Beneficiario con ID ${id} no encontrado`, 'Not Found')
}

export function camposDesconocidos(cuerpo: Record<string, unknown>, permitidos: readonly string[]) {
  return Object.keys(cuerpo)
    .filter((campo) => !permitidos.includes(campo))
    .map((campo) => `property ${campo} should not exist`)
}
