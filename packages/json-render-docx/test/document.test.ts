import { describe, expect, it } from 'vitest'

import { docSpec, PNG, render } from './helpers'

describe('Document and Section', () => {
  it('writes a docx package with the document properties', async () => {
    const out = await render(docSpec())
    expect(out.warnings).toEqual([])
    expect(out.xml('docProps/core.xml')).toContain('Report')
    expect(out.xml('docProps/core.xml')).toContain('Jane Doe')
  })

  it('applies the page size, orientation and margin of a Section', async () => {
    const spec = docSpec()
    spec.elements.section!.props = { size: 'Letter', orientation: 'landscape', margin: 0.5 }
    const xml = (await render(spec)).xml('word/document.xml')
    expect(xml).toContain('w:orient="landscape"')
    expect(xml).toMatch(/<w:pgMar [^>]*w:top="720"/)
  })
})

describe('text blocks', () => {
  it('writes the title and headings with Word styles', async () => {
    const xml = (await render(docSpec())).xml('word/document.xml')
    expect(xml).toContain('w:val="Title"')
    expect(xml).toMatch(/w:val="Heading1"[\s\S]*Summary/)
    expect(xml).toMatch(/w:val="Heading2"[\s\S]*Appendix/)
  })

  it('writes paragraphs as text, not pictures', async () => {
    const xml = (await render(docSpec())).xml('word/document.xml')
    expect(xml).toContain('Revenue grew in every quarter.')
    expect(xml).not.toContain('<w:drawing>')
  })

  it('writes a page break', async () => {
    expect((await render(docSpec())).xml('word/document.xml')).toContain('<w:br w:type="page"/>')
  })
})

describe('List', () => {
  it('writes one numbered paragraph per item', async () => {
    const xml = (await render(docSpec())).xml('word/document.xml')
    expect(xml).toContain('Faster checkout')
    expect(xml.match(/<w:numPr>/g)).toHaveLength(2)
  })
})

describe('Table', () => {
  it('writes a native table with a repeating header row', async () => {
    const xml = (await render(docSpec())).xml('word/document.xml')
    expect(xml.match(/<w:tr[ >]/g)).toHaveLength(3)
    expect(xml).toContain('<w:tblHeader')
    for (const cell of ['Team', 'Owner', 'Checkout', 'Tomas']) expect(xml).toContain(cell)
  })

  it('pads short rows to the column count', async () => {
    const spec = docSpec()
    spec.elements.table!.props = { columns: ['A', 'B', 'C'], rows: [['only']], striped: null }
    const xml = (await render(spec)).xml('word/document.xml')
    expect(xml.match(/<w:tc>/g)).toHaveLength(6)
  })
})

describe('Header and Footer', () => {
  it('writes header and footer parts with page number fields', async () => {
    const out = await render(docSpec())
    expect(out.part(/^word\/header\d+\.xml$/)).toContain('Project report')
    const footer = out.part(/^word\/footer\d+\.xml$/)
    expect(footer).toContain('Confidential')
    expect(footer).toContain('PAGE')
    expect(footer).toContain('NUMPAGES')
  })
})

describe('Image', () => {
  const image = (src: string) => {
    const spec = docSpec()
    spec.elements.img = { type: 'Image', props: { src, alt: 'A pixel', width: 2 }, children: [] }
    spec.elements.section!.children!.push('img')
    return spec
  }

  it('embeds a picture with alt text', async () => {
    const out = await render(image(PNG))
    const xml = out.xml('word/document.xml')
    expect(xml).toContain('<w:drawing>')
    expect(xml).toContain('descr="A pixel"')
    expect(out.warnings).toEqual([])
  })

  it.each(['/etc/passwd', 'file:///etc/passwd', 'http://example.com/a.png'])('blocks %s', async (src) => {
    const out = await render(image(src))
    expect(out.warnings).toContainEqual(expect.objectContaining({ code: 'blocked-image' }))
    expect(out.xml('word/document.xml')).not.toContain('<w:drawing>')
  })

  it('loads https images through the given loader', async () => {
    const out = await render(image('https://example.com/a.png'), { loadImage: () => Promise.resolve(PNG) })
    expect(out.xml('word/document.xml')).toContain('<w:drawing>')
  })
})

describe('TableOfContents', () => {
  it('writes a TOC field that Word fills in', async () => {
    const spec = docSpec()
    spec.elements.toc = { type: 'TableOfContents', props: { title: 'Contents', maxLevel: 2 }, children: [] }
    spec.elements.section!.children!.unshift('toc')
    const xml = (await render(spec)).xml('word/document.xml')
    expect(xml).toContain('TOC')
    expect(xml).toContain('Contents')
  })
})

describe('partial specs', () => {
  it('renders an empty document while the root is missing', async () => {
    const out = await render({ root: 'doc', elements: {} })
    expect(out.warnings.map((w) => w.code)).toEqual(['missing-root'])
  })

  it('drops blocks that sit directly under the Document', async () => {
    const spec = docSpec()
    spec.elements.doc!.children = ['p', 'section']
    const out = await render(spec)
    expect(out.xml('word/document.xml')).toContain('Quarterly report')
  })

  it('never throws on every prefix of the element list', async () => {
    const full = docSpec()
    const keys = Object.keys(full.elements)
    for (let n = 0; n <= keys.length; n++) {
      const spec = {
        root: full.root,
        elements: Object.fromEntries(keys.slice(0, n).map((k) => [k, full.elements[k]!])),
      }
      await expect(render(spec)).resolves.toBeDefined()
    }
  })
})

describe('text options', () => {
  const paragraph = (props: Record<string, unknown>) => {
    const spec = docSpec()
    spec.elements.p!.props = {
      text: 'Styled',
      align: null,
      bold: null,
      italic: null,
      color: null,
      fontSize: null,
      ...props,
    }
    return spec
  }

  it('writes bold, italic, color, size and alignment', async () => {
    const xml = (
      await render(paragraph({ bold: true, italic: true, color: '#FF0000', fontSize: 16, align: 'center' }))
    ).xml('word/document.xml')
    expect(xml).toContain('<w:b/>')
    expect(xml).toContain('<w:i/>')
    expect(xml).toContain('FF0000')
    expect(xml).toContain('w:val="32"')
    expect(xml).toContain('w:val="center"')
  })

  it('writes a numbered list as ordered', async () => {
    const spec = docSpec()
    spec.elements.list!.props = { items: ['One', 'Two'], ordered: true }
    expect((await render(spec)).xml('word/numbering.xml')).toContain('decimal')
  })

  it('leaves out the page numbers and the text of a Footer when they are off', async () => {
    const spec = docSpec()
    spec.elements.footer!.props = { text: null, pageNumbers: false, align: 'left' }
    const footer = (await render(spec)).part(/^word\/footer\d+\.xml$/)
    expect(footer).not.toContain('NUMPAGES')
  })

  it('writes page numbers alone when the Footer has no text', async () => {
    const spec = docSpec()
    spec.elements.footer!.props = { text: null, pageNumbers: true, align: null }
    expect((await render(spec)).part(/^word\/footer\d+\.xml$/)).toContain('NUMPAGES')
  })

  it('keeps the colors and fonts of a custom theme', async () => {
    const out = await render(docSpec(), { theme: { fonts: { body: 'Georgia' }, colors: { tableHeader: '#336699' } } })
    expect(out.xml('word/document.xml')).toContain('336699')
    expect(out.xml('word/styles.xml')).toContain('Georgia')
  })
})
