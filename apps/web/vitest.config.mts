import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

const fromRoot = (path: string) => fileURLToPath(new URL(path, import.meta.url))

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [{ find: /^@\//, replacement: fromRoot('./') }],
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./test/setup.ts'],
    // Unit and component tests live next to the code.
    include: ['**/*.spec.{ts,tsx}'],
    exclude: ['node_modules/**', '.next/**', 'out/**'],
    restoreMocks: true,
  },
})
