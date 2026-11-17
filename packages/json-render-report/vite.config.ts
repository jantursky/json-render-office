import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'

const root = (path: string): string => resolve(import.meta.dirname, path)

const pkg = JSON.parse(readFileSync(root('package.json'), 'utf8')) as {
  dependencies: Record<string, string>
  peerDependencies: Record<string, string>
}
const external = ['node:fs/promises', ...Object.keys(pkg.dependencies), ...Object.keys(pkg.peerDependencies)]

export default defineConfig({
  plugins: [dts({ tsconfigPath: './tsconfig.build.json', include: ['src'] })],
  build: {
    lib: {
      entry: { index: root('src/index.ts'), server: root('src/server.ts'), web: root('src/web.ts') },
      formats: ['es'],
      fileName: (_format, name) => `${name}.js`,
    },
    rollupOptions: {
      external: (id) => external.some((name) => id === name || id.startsWith(`${name}/`)),
    },
    sourcemap: true,
    minify: true,
    target: 'es2020',
    emptyOutDir: true,
  },
})
