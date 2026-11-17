import type { Spec } from '@json-render/core'
import { strFromU8, unzipSync } from 'fflate'

import { renderToBuffer, type RenderOptions, type RenderWarning } from '../src'

export interface Rendered {
  files: Record<string, Uint8Array>
  /** The text of one part of the package, such as `ppt/slides/slide1.xml`. */
  xml: (path: string) => string
  warnings: RenderWarning[]
}

export async function render(spec: Spec, options: RenderOptions = {}): Promise<Rendered> {
  const warnings: RenderWarning[] = []
  const bytes = await renderToBuffer(spec, { ...options, onWarn: (w) => warnings.push(w) })
  const files = unzipSync(bytes)
  return {
    files,
    warnings,
    xml: (path) => {
      const file = files[path]
      if (!file) throw new Error(`No ${path} in the package. Has: ${Object.keys(files).join(', ')}`)
      return strFromU8(file)
    },
  }
}

export const deckSpec = (): Spec => ({
  root: 'deck',
  elements: {
    deck: { type: 'Deck', props: { title: 'Review', author: null, subject: null }, children: ['cover', 'content'] },
    cover: {
      type: 'Slide',
      props: { layout: 'title', background: null, notes: 'Welcome everyone.' },
      children: ['coverTitle', 'coverSub'],
    },
    coverTitle: { type: 'Title', props: { text: 'Quarterly review', align: null, color: null }, children: [] },
    coverSub: { type: 'Subtitle', props: { text: 'Q3 2026', align: null, color: null }, children: [] },
    content: { type: 'Slide', props: { layout: null, background: null, notes: null }, children: ['title', 'bullets'] },
    title: { type: 'Title', props: { text: 'What changed', align: null, color: null }, children: [] },
    bullets: {
      type: 'BulletList',
      props: { items: ['Revenue up 24%', 'Churn down', 'Two regions'], ordered: null, fontSize: null, color: null },
      children: [],
    },
  },
})
