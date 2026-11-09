import type { SesionStoragePort } from '@/modules/auth/application/ports/SesionStoragePort.ts'

const CLAVE_TOKEN = 'sig-ccpt.token'

// Si el navegador bloquea localStorage, el token vive en memoria hasta recargar.
export class SesionLocalStorage implements SesionStoragePort {
  #respaldo: string | null = null

  obtenerToken(): string | null {
    try {
      return localStorage.getItem(CLAVE_TOKEN) ?? this.#respaldo
    } catch {
      return this.#respaldo
    }
  }

  guardarToken(token: string): void {
    try {
      localStorage.setItem(CLAVE_TOKEN, token)
      this.#respaldo = null
    } catch {
      this.#respaldo = token
    }
  }

  borrarToken(): void {
    this.#respaldo = null
    try {
      localStorage.removeItem(CLAVE_TOKEN)
    } catch {
      // Sin acceso al almacenamiento no hay nada que borrar.
    }
  }

  // El evento `storage` solo llega a las demás pestañas del navegador.
  suscribirCambiosExternos(oyente: (token: string | null) => void): () => void {
    const alCambiar = ({ key, newValue }: StorageEvent) => {
      if (key === CLAVE_TOKEN || key === null) oyente(newValue)
    }

    window.addEventListener('storage', alCambiar)
    return () => window.removeEventListener('storage', alCambiar)
  }
}
