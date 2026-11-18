import type { Spec } from '@json-render/core'
import { unzipSync } from 'fflate'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { defineComponent } from 'vue'
import { describe, expect, it } from 'vitest'

import { renderToFile } from '../src'
import { docSpec, render } from './helpers'

describe('render options', () => {
  it('writes a .docx file with renderToFile', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'jr-docx-'))
    try {
      const path = join(dir, 'report.docx')
      await renderToFile(docSpec(), path, { onWarn: () => {} })
      expect(Object.keys(unzipSync(new Uint8Array(await readFile(path))))).toContain('word/document.xml')
    } finally {
      await rm(dir, { recursive: true })
    }
  })

  it('knows no component without the standard ones', async () => {
    const out = await render(docSpec(), { includeStandard: false })
    expect(out.warnings.map((w) => w.code)).toEqual(['unknown-type'])
  })

  it('lets a registry entry replace a standard component', async () => {
    const Nothing = defineComponent({ render: () => null })
    const out = await render(docSpec(), { registry: { List: Nothing } })
    expect(out.xml('word/document.xml')).toContain('Summary')
    expect(out.xml('word/document.xml')).not.toContain('Faster checkout')
  })

  it('takes font sizes from the theme', async () => {
    const out = await render(docSpec(), { theme: { sizes: { title: 40 } } })
    expect(out.xml('word/styles.xml')).toContain('<w:sz w:val="80"/>')
  })
})

describe('specs that do not fit the catalog', () => {
  it('skips a list without items', async () => {
    const spec = docSpec()
    spec.elements.list = { type: 'List', props: {}, children: [] }
    const out = await render(spec)
    expect(out.warnings.map((w) => w.code)).toEqual(['bad-props'])
    expect(out.xml('word/document.xml')).toContain('Summary')
  })

  it('leaves out an image whose bytes are not the type it claims', async () => {
    const spec: Spec = docSpec()
    spec.elements.pic = {
      type: 'Image',
      props: { src: 'data:image/png;base64,AQID', alt: 'x', width: null, height: null, align: null },
      children: [],
    }
    spec.elements.section!.children = [...(spec.elements.section!.children ?? []), 'pic']
    const out = await render(spec)
    expect(out.warnings.map((w) => w.code)).toContain('image-failed')
    expect(Object.keys(out.files).filter((f) => f.startsWith('word/media/'))).toEqual([])
  })

  it('stops a section that contains itself', async () => {
    const spec = docSpec()
    spec.elements.p!.children = ['p']
    const out = await render(spec)
    expect(out.warnings.map((w) => w.code)).toContain('cycle')
  })
})
