import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'


export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'node',
    globals: true,
    include: ['tests/**/*.test.{ts,tsx}', 'src/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/**/*.d.ts', 'src/**/*.test.{ts,tsx}'],
      thresholds: {
        lines: 50,
        branches: 40,
        functions: 40,
        statements: 50,
      },
    },
  },
})
