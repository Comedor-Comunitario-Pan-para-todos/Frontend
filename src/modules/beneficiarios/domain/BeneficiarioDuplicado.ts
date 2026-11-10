/** El servidor rechazó el registro porque esa persona ya está en el padrón. */
export class BeneficiarioDuplicado extends Error {
  /** Documento que ya estaba registrado, cuando se conoce. */
  readonly numeroDocumento: string | null

  constructor(numeroDocumento: string | null = null, causa?: unknown) {
    super('La persona ya está registrada en el padrón', { cause: causa })
    this.name = 'BeneficiarioDuplicado'
    this.numeroDocumento = numeroDocumento
  }
}

export function esBeneficiarioDuplicado(error: unknown): error is BeneficiarioDuplicado {
  return error instanceof BeneficiarioDuplicado
}
