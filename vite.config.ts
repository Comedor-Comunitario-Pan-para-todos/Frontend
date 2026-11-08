import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'
import { defineConfig, loadEnv, type ProxyOptions } from 'vite'

function crearProxy(variables: Record<string, string>): Record<string, ProxyOptions> | undefined {
  const base = (variables.VITE_API_BASE_URL || '/api').trim().replace(/\/+$/, '')
  const destino = variables.API_PROXY_TARGET?.trim()

  // Con una URL completa el navegador llama directo a la API: no hay nada que reenviar.
  if (!base.startsWith('/') || !destino) return undefined

  if (!URL.canParse(destino)) {
    throw new Error(`API_PROXY_TARGET debe ser una URL completa (recibido: "${destino}")`)
  }

  // Mientras el backend no tenga el prefijo global `/api`, se quita antes de reenviar.
  const quitarPrefijo = (variables.API_PROXY_QUITAR_PREFIJO ?? 'true') === 'true'

  return {
    [base]: {
      target: destino,
      changeOrigin: true,
      rewrite: quitarPrefijo ? (ruta) => ruta.slice(base.length) || '/' : undefined,
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const variables = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      proxy: crearProxy(variables),
    },
  }
})
