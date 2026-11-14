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
    },
  }),
)
