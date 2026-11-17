import { JSONUIProvider, Renderer } from '@json-render/vue'
import { createSSRApp, h } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { describe, expect, it } from 'vitest'

import { renderToDocx, renderToDocxBlob, renderToPptx, renderToPptxBlob } from '../src'
import { webRegistry } from '../src/web'
import { reportSpec, unzip } from './helpers'

const bare = () => {
  const spec = reportSpec()
  spec.elements.report!.props = { title: 'Plain', subtitle: null, author: null }
  spec.elements.chart!.props = {
    type: 'pie',
    title: null,
    labels: ['A', 'B'],
    series: [
      { name: 'S1', values: [1, 2] },
      { name: 'S2', values: [3, 4] },
    ],
  }
  spec.elements.list!.props = { items: ['One', 'Two'], ordered: true }
  spec.elements.table!.props = { columns: ['A', 'B'], rows: [['x']], striped: null }
  return spec
}

const web = (spec = bare()) =>
  renderToString(
    createSSRApp({
      render: () =>
        h(JSONUIProvider, { registry: webRegistry }, { default: () => h(Renderer, { spec, registry: webRegistry }) }),
    }),
  )

describe('reports without the optional parts', () => {
  it('writes a cover with only the title', async () => {
    const pptx = unzip(await renderToPptx(bare()))
    expect(pptx.xml('ppt/slides/slide1.xml')).toContain('Plain')
    expect(pptx.xml('ppt/slides/slide1.xml')).not.toContain('·')
  })

  it('writes a document with only the title', async () => {
    const xml = unzip(await renderToDocx(bare())).xml('word/document.xml')
    expect(xml).toContain('Plain')
    expect(xml).not.toContain('·')
  })

  it('writes a pie as the first series only, without a heading when it has no title', async () => {
    const xml = unzip(await renderToDocx(bare())).xml('word/document.xml')
    expect(xml).not.toContain('S2')
    expect(xml).not.toContain('w:val="Heading3"')
  })

  it('renders every optional part on the web', async () => {
    const out = await web()
    expect(out).toContain('<ol>')
    expect(out).not.toContain('jr-subtitle')
    expect(out).not.toContain('jr-author')
    expect(out).not.toContain('<figcaption>')
    expect(out).toContain('aria-label="pie chart"')
    expect(out.match(/<li><i/g)).toHaveLength(2)
  })

  it('renders a half-empty chart without throwing', async () => {
    const spec = bare()
    spec.elements.chart!.props = { type: 'line', title: 'x', labels: [], series: [{ name: 'x', values: [] }] }
    await expect(web(spec)).resolves.toContain('<svg')
  })
})

describe('Blob variants', () => {
  it('return Blobs with the Office MIME types', async () => {
    expect((await renderToPptxBlob(bare())).type).toContain('presentationml')
    expect((await renderToDocxBlob(bare())).type).toContain('wordprocessingml')
  })
})
