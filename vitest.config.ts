import { defineConfig, mergeConfig } from 'vitest/config'
import viteConfig from './vite.config.ts'

export default defineConfig((entorno) =>
  mergeConfig(viteConfig(entorno), {
    test: {
      environment: 'jsdom',
      include: ['tests/**/*.test.{ts,tsx}'],
      setupFiles: ['./tests/setup.ts'],
      css: false,
      maxWorkers: '50%',
      // Las pruebas de pantalla escriben letra por letra en formularios completos y con el
      // equipo ocupado pasan de 5 s. 15 s sigue atrapando una prueba que se cuelgue.
      testTimeout: 15_000,
    },
  }),
)
