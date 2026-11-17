import type { Spec } from '@json-render/core'
import { describe, expect, it } from 'vitest'

import { render } from './helpers'

const PNG =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='

const slide = (...elements: Record<string, Spec['elements'][string]>[]): Spec => ({
  root: 'deck',
  elements: {
    deck: { type: 'Deck', props: { title: null, author: null, subject: null }, children: ['slide'] },
    slide: {
      type: 'Slide',
      props: { layout: null, background: null, notes: null, slideNumber: null },
      children: elements.flatMap((e) => Object.keys(e)),
    },
    ...Object.assign({}, ...elements),
  },
})

describe('Table', () => {
  const table = {
    t: {
      type: 'Table',
      props: {
        columns: ['Region', 'Revenue'],
        rows: [
          ['EMEA', '$4.2M'],
          ['Americas', '$6.8M'],
        ],
        fontSize: null,
        striped: true,
      },
      children: [],
    },
  }

  it('writes a native table with a header row and the data', async () => {
    const xml = (await render(slide(table))).xml('ppt/slides/slide1.xml')
    expect(xml).toContain('<a:tbl>')
    expect(xml.match(/<a:tr /g)).toHaveLength(3)
    for (const text of ['Region', 'Revenue', 'EMEA', '$6.8M']) expect(xml).toContain(text)
  })

  it('pads short rows to the column count', async () => {
    const short = { t: { ...table.t, props: { ...table.t.props, rows: [['only one']] } } }
    const xml = (await render(slide(short))).xml('ppt/slides/slide1.xml')
    expect(xml.match(/<a:tc[ >]/g)).toHaveLength(4)
  })
})

describe('Chart', () => {
  const chart = {
    c: {
      type: 'Chart',
      props: {
        type: 'bar',
        title: 'Revenue',
        labels: ['Q1', 'Q2'],
        series: [{ name: 'Revenue', values: [4, 6] }],
        legend: null,
      },
      children: [],
    },
  }

  it('writes a native chart part with an embedded workbook', async () => {
    const out = await render(slide(chart))
    expect(out.part(/^ppt\/charts\/chart\d+\.xml$/)).toContain('<c:barChart>')
    expect(Object.keys(out.files).some((f) => f.startsWith('ppt/embeddings/'))).toBe(true)
    expect(out.xml('ppt/slides/slide1.xml')).not.toContain('<p:pic>')
  })

  it('draws a pie from the first series only', async () => {
    const pie = {
      c: {
        ...chart.c,
        props: {
          ...chart.c.props,
          type: 'pie',
          series: [
            { name: 'A', values: [1, 2] },
            { name: 'B', values: [3, 4] },
          ],
        },
      },
    }
    const out = await render(slide(pie))
    expect(out.part(/^ppt\/charts\/chart\d+\.xml$/).match(/<c:ser>/g)).toHaveLength(1)
  })
})

describe('Image', () => {
  const image = (src: string) => ({
    i: { type: 'Image', props: { src, alt: 'A pixel' }, children: [] },
  })

  it('writes a picture with alt text from a data URI', async () => {
    const out = await render(slide(image(PNG)))
    const xml = out.xml('ppt/slides/slide1.xml')
    expect(xml).toContain('<p:pic>')
    expect(xml).toContain('descr="A pixel"')
    expect(out.warnings).toEqual([])
  })

  it.each(['/etc/passwd', 'file:///etc/passwd', 'http://example.com/a.png', '../secret.png'])(
    'blocks %s without reading it',
    async (src) => {
      const out = await render(slide(image(src)))
      expect(out.warnings).toContainEqual(expect.objectContaining({ code: 'blocked-image' }))
      expect(out.xml('ppt/slides/slide1.xml')).not.toContain('<p:pic>')
    },
  )

  it('loads https images through the given loader', async () => {
    const seen: string[] = []
    const out = await render(slide(image('https://example.com/a.png')), {
      loadImage: (src) => {
        seen.push(src)
        return Promise.resolve(PNG)
      },
    })
    expect(seen).toEqual(['https://example.com/a.png'])
    expect(out.xml('ppt/slides/slide1.xml')).toContain('<p:pic>')
  })

  it('warns and skips the picture when loading fails', async () => {
    const out = await render(slide(image('https://example.com/a.png')), {
      loadImage: () => Promise.reject(new Error('HTTP 404')),
    })
    expect(out.warnings).toContainEqual(expect.objectContaining({ code: 'image-failed' }))
    expect(out.xml('ppt/slides/slide1.xml')).not.toContain('<p:pic>')
  })
})

describe('Columns', () => {
  it('places each column next to the other', async () => {
    const spec = slide({
      cols: { type: 'Columns', props: { gap: null }, children: ['a', 'b'] },
      a: { type: 'Column', props: {}, children: ['ta'] },
      b: { type: 'Column', props: {}, children: ['tb'] },
      ta: {
        type: 'Text',
        props: { text: 'Left side', fontSize: null, bold: null, italic: null, align: null, color: null },
        children: [],
      },
      tb: {
        type: 'Text',
        props: { text: 'Right side', fontSize: null, bold: null, italic: null, align: null, color: null },
        children: [],
      },
    })
    spec.elements.slide!.children = ['cols']
    const xml = (await render(spec)).xml('ppt/slides/slide1.xml')
    // The x offset of the shape that holds the text.
    const offset = (text: string): number => {
      const shape = xml.split('<p:sp>').find((part) => part.includes(text))
      return Number(/<a:off x="(\d+)"/.exec(shape ?? '')?.[1])
    }
    expect(offset('Right side')).toBeGreaterThan(offset('Left side'))
  })
})

describe('Slide number', () => {
  it('shows the number when asked', async () => {
    const spec = slide()
    spec.elements.slide!.props = { layout: null, background: null, notes: null, slideNumber: true }
    expect((await render(spec)).xml('ppt/slides/slide1.xml')).toContain('type="slidenum"')
  })
})
