export interface SesionStoragePort {
  obtenerToken(): string | null
  guardarToken(token: string): void
  borrarToken(): void
}
