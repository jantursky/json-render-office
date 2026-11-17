import { fileURLToPath } from 'node:url'

import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

const page = (name: string) => fileURLToPath(new URL(name, import.meta.url))

// The PPTX and DOCX writers are loaded on demand, so the warning would fire on every build.
// `examples.html` renders the components the docs embed, so the e2e suite can cover them.
export default defineConfig({
  plugins: [vue()],
  build: {
    chunkSizeWarningLimit: 2500,
    rollupOptions: { input: { main: page('index.html'), examples: page('examples.html') } },
  },
})
