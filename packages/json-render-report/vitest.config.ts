import { resolve } from 'node:path'

import { defineConfig } from 'vitest/config'

const sibling = (name: string): string => resolve(import.meta.dirname, `../${name}/src/index.ts`)

export default defineConfig({
  resolve: {
    alias: {
      'json-render-office': sibling('json-render-office'),
      'json-render-pptx': sibling('json-render-pptx'),
      'json-render-docx': sibling('json-render-docx'),
    },
  },
  test: {
    environment: 'node',
    include: ['test/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: ['src/index.ts', 'src/server.ts'],
      reporter: ['text-summary', 'text', 'html', 'lcov'],
      thresholds: { statements: 90, branches: 80, functions: 90, lines: 90 },
    },
  },
})
