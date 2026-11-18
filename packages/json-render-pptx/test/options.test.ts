import type { Spec } from '@json-render/core'
import { unzipSync } from 'fflate'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { defineComponent } from 'vue'
import { describe, expect, it } from 'vitest'

import { renderToFile } from '../src'
import { deckSpec, render } from './helpers'

describe('render options', () => {
  it('writes a .pptx file with renderToFile', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'jr-pptx-'))
    try {
      const path = join(dir, 'deck.pptx')
      await renderToFile(deckSpec(), path, { onWarn: () => {} })
      expect(Object.keys(unzipSync(new Uint8Array(await readFile(path))))).toContain('ppt/presentation.xml')
    } finally {
      await rm(dir, { recursive: true })
    }
  })

  it('knows no component without the standard ones', async () => {
    const out = await render(deckSpec(), { includeStandard: false })
    expect(out.warnings.map((w) => w.code)).toEqual(['unknown-type'])
    expect(out.xml('ppt/presentation.xml')).toContain('<p:presentation')
  })

  it('lets a registry entry replace a standard component', async () => {
    const Nothing = defineComponent({ render: () => null })
    const out = await render(deckSpec(), { registry: { BulletList: Nothing } })
    expect(out.xml('ppt/slides/slide2.xml')).toContain('What changed')
    expect(out.xml('ppt/slides/slide2.xml')).not.toContain('Revenue up 24%')
  })

  it('takes font sizes from the theme', async () => {
    const out = await render(deckSpec(), { theme: { sizes: { title: 44 } } })
    expect(out.xml('ppt/slides/slide2.xml')).toContain('sz="4400"')
  })
})

describe('specs that do not fit the catalog', () => {
  it('skips a list without items and a table with rows that are not a list', async () => {
    const spec = deckSpec()
    spec.elements.bullets = { type: 'BulletList', props: {}, children: [] }
    spec.elements.table = { type: 'Table', props: { columns: ['A'], rows: 'x', striped: null }, children: [] }
    spec.elements.content!.children = ['title', 'bullets', 'table']
    const out = await render(spec)
    expect(out.warnings.map((w) => w.code)).toEqual(['bad-props', 'bad-props'])
    expect(out.xml('ppt/slides/slide2.xml')).toContain('What changed')
  })

  it('stops a slide that contains itself', async () => {
    const spec: Spec = deckSpec()
    spec.elements.content!.children = ['title', 'content']
    const out = await render(spec)
    expect(out.warnings.map((w) => w.code)).toEqual(['cycle'])
  })

  it('renders a repeat over a state value that is not a list as nothing', async () => {
    const spec = deckSpec()
    spec.elements.content!.repeat = { statePath: '/rows' }
    const out = await render(spec, { state: { rows: 'abc' } })
    expect(out.warnings.map((w) => w.code)).toEqual(['bad-repeat'])
  })
})
