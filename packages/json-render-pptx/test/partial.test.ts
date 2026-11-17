import type { Spec } from '@json-render/core'
import { describe, expect, it } from 'vitest'

import { deckSpec, render } from './helpers'

describe('partial specs', () => {
  it('renders an empty deck when the root is not there yet', async () => {
    const out = await render({ root: 'deck', elements: {} })
    expect(out.warnings.map((w) => w.code)).toEqual(['missing-root'])
  })

  it('skips children that have not streamed in yet', async () => {
    const spec = deckSpec()
    delete spec.elements.bullets
    const out = await render(spec)
    expect(out.warnings).toContainEqual(expect.objectContaining({ code: 'missing-element', element: 'bullets' }))
    expect(out.xml('ppt/slides/slide2.xml')).toContain('What changed')
  })

  it('skips unknown types', async () => {
    const spec: Spec = deckSpec()
    spec.elements.title = { type: 'Hologram', props: {}, children: [] }
    const out = await render(spec)
    expect(out.warnings).toContainEqual(expect.objectContaining({ code: 'unknown-type', element: 'title' }))
  })

  it('never throws on every prefix of the element list', async () => {
    const full = deckSpec()
    const keys = Object.keys(full.elements)
    for (let n = 0; n <= keys.length; n++) {
      const spec: Spec = {
        root: full.root,
        elements: Object.fromEntries(keys.slice(0, n).map((k) => [k, full.elements[k]!])),
      }
      await expect(render(spec)).resolves.toBeDefined()
    }
  })
})
