import { vi } from 'vitest'
import { USUARIOS_MOCK } from '@/mocks/handlers.ts'
import type { Rol } from '@/modules/auth/domain/Usuario.ts'
import { AxiosHttpClient } from '@/shared/infrastructure/http/AxiosHttpClient.ts'

export function tokenDe(rol: Rol): string {
  return `mock-token.${USUARIOS_MOCK.find((u) => u.rol === rol && u.activo)!.id}`
}

export function crearHttp(token: string | null) {
  return new AxiosHttpClient({
    baseUrl: '/api',
    sesion: { obtenerToken: () => token, alExpirarSesion: vi.fn() },
  })
}
