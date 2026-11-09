import { z } from 'zod'
import type {
  AuthRepository,
  Credenciales,
  SesionIniciada,
} from '@/modules/auth/application/ports/AuthRepository.ts'
import { ROLES, type Usuario } from '@/modules/auth/domain/Usuario.ts'
import type { HttpClient } from '@/shared/infrastructure/http/HttpClient.ts'

const esquemaUsuario = z.object({
  id: z.string(),
  email: z.string(),
  nombreCompleto: z.string(),
  rol: z.enum(ROLES),
})

const esquemaLogin = z.object({
  accessToken: z.string().min(1),
  usuario: esquemaUsuario,
})

export class AuthHttpRepository implements AuthRepository {
  readonly #http: HttpClient

  constructor(http: HttpClient) {
    this.#http = http
  }

  async iniciarSesion(credenciales: Credenciales): Promise<SesionIniciada> {
    const { accessToken, usuario } = await this.#http.post('/auth/login', credenciales, {
      esquema: esquemaLogin,
      omitirSesion: true,
    })
    return { token: accessToken, usuario }
  }

  consultarUsuarioActual(): Promise<Usuario> {
    return this.#http.get('/auth/me', { esquema: esquemaUsuario })
  }
}
