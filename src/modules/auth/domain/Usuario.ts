export const ROLES = ['COORDINADORA', 'PRESIDENTE_JAC', 'VOLUNTARIO', 'DONANTE'] as const

export type Rol = (typeof ROLES)[number]

export interface Usuario {
  readonly id: string
  readonly email: string
  readonly nombreCompleto: string
  readonly rol: Rol
}
