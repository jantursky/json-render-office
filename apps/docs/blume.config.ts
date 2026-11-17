import { readFileSync } from 'node:fs'

import { defineConfig } from 'blume'

const pkg = JSON.parse(
  readFileSync(new URL('../../packages/json-render-report/package.json', import.meta.url), 'utf8'),
) as { version: string }
const gallery = JSON.parse(readFileSync(new URL('public/gallery/manifest.json', import.meta.url), 'utf8')) as {
  libreOffice: string
}

export default defineConfig({
  title: 'json-render-office',
  description: 'Render json-render specs to editable PowerPoint and Word files.',
  logo: { image: { light: '/logo.svg', dark: '/icon-dark.svg', alt: '' } },
  github: {
    owner: 'jantursky',
    repo: 'json-render-office',
    dir: 'apps/docs',
  },
  navigation: {
    actions: [
      // Placeholders until the demo and the docs are deployed.
      { href: 'https://json-render-office.vercel.app', label: 'Demo' },
      { href: 'https://www.npmjs.com/package/json-render-report', label: 'npm' },
    ],
  },
  footer: {
    copyright:
      'Community project. Not affiliated with or endorsed by Vercel. "json-render" is the name of the Vercel Labs project these packages render for.',
  },
  content: {
    root: 'docs',
  },
  theme: {
    accent: { light: '#e42b0c', dark: '#ff5a3d' },
    radius: 'md',
    mode: 'system',
    fonts: { display: 'inter', body: 'inter', mono: 'jetbrains-mono' },
  },
  variables: {
    version: pkg.version,
    libreoffice: gallery.libreOffice,
  },
  // The live previews run the demo app's example files, so the docs and the demo never drift apart.
  examples: {
    source: '../example/src/examples/*Example.vue',
    css: 'examples.css',
  },
})
