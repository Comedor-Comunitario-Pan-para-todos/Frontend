import { z } from 'zod'

export interface Entorno {
  readonly apiBaseUrl: string
  readonly usarMocks: boolean
}

export class ErrorDeEntorno extends Error {
  constructor(problemas: string[]) {
    super(`Configuración de entorno inválida:\n${problemas.map((p) => `  - ${p}`).join('\n')}`)
    this.name = 'ErrorDeEntorno'
  }
}

const esquemaEntorno = z
  .object({
    PROD: z.boolean(),
    VITE_API_BASE_URL: z
      .string()
      .trim()
      .default('/api')
      .refine((valor) => valor.startsWith('/') || URL.canParse(valor), {
        message: 'debe ser una ruta que empiece por "/" o una URL completa',
      }),
    VITE_USAR_MOCKS: z
      .enum(['true', 'false'], { message: 'debe ser "true" o "false"' })
      .default('false'),
  })
  .refine((variables) => !(variables.PROD && variables.VITE_USAR_MOCKS === 'true'), {
    message: 'no se permiten mocks en un build de producción',
    path: ['VITE_USAR_MOCKS'],
  })

export function leerEntorno(variables: Record<string, unknown>): Entorno {
  const resultado = esquemaEntorno.safeParse(variables)

  if (!resultado.success) {
    throw new ErrorDeEntorno(
      resultado.error.issues.map((problema) => `${problema.path.join('.')}: ${problema.message}`),
    )
  }

  return {
    apiBaseUrl: resultado.data.VITE_API_BASE_URL.replace(/\/+$/, ''),
    usarMocks: resultado.data.VITE_USAR_MOCKS === 'true',
  }
}

export const entorno: Entorno = leerEntorno(import.meta.env)
