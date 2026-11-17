import { describe, expect, it } from 'vitest'

import { renderToDocx, renderToPptx } from '../src'
import { reportSpec, unzip } from './helpers'

describe('report to PPTX', () => {
  it('writes a cover and one slide per Chapter', async () => {
    const pptx = unzip(await renderToPptx(reportSpec()))
    expect(pptx.names(/^ppt\/slides\/slide\d+\.xml$/)).toHaveLength(3)
    expect(pptx.xml('ppt/slides/slide1.xml')).toContain('Quarterly review')
    expect(pptx.xml('ppt/slides/slide1.xml')).toContain('Q3 2026  ·  Finance team')
  })

  it('maps the content onto native slide objects', async () => {
    const pptx = unzip(await renderToPptx(reportSpec()))
    const slide2 = pptx.xml('ppt/slides/slide2.xml')
    expect(slide2).toContain('Revenue grew 24%')
    expect(slide2).toContain('Growth came from enterprise.')
    expect(slide2.match(/<a:buChar/g)).toHaveLength(2)
    expect(pptx.names(/^ppt\/charts\/chart\d+\.xml$/)).toHaveLength(1)
    const slide3 = pptx.xml('ppt/slides/slide3.xml')
    expect(slide3).toContain('<a:tbl>')
    expect(slide3).toContain('<p:pic>')
  })

  it('keeps speaker notes', async () => {
    const pptx = unzip(await renderToPptx(reportSpec()))
    expect(
      pptx
        .names(/notesSlide\d+\.xml$/)
        .map((n) => pptx.xml(n))
        .join(),
    ).toContain('Say thanks.')
  })
})

describe('report to DOCX', () => {
  it('writes a title and a Heading 1 per Chapter', async () => {
    const docx = unzip(await renderToDocx(reportSpec()))
    const xml = docx.xml('word/document.xml')
    expect(xml).toContain('w:val="Title"')
    expect(xml.match(/w:val="Heading1"/g)).toHaveLength(2)
    expect(xml).toContain('Revenue grew 24%')
    expect(xml).toContain('Q3 2026  ·  Finance team')
  })

  it('writes a chart as a table of its numbers', async () => {
    const docx = unzip(await renderToDocx(reportSpec()))
    const xml = docx.xml('word/document.xml')
    expect(xml).toContain('Revenue by quarter')
    expect(xml.match(/<w:tbl>/g)).toHaveLength(2)
    expect(docx.names(/chart/)).toEqual([])
  })

  it('writes the list, the table and the image', async () => {
    const xml = unzip(await renderToDocx(reportSpec())).xml('word/document.xml')
    expect(xml).toContain('Enterprise up 31%')
    expect(xml).toContain('EMEA')
    expect(xml).toContain('<w:drawing>')
  })
})

describe('partial reports', () => {
  it('renders every prefix of the element list to both formats', async () => {
    const full = reportSpec()
    const keys = Object.keys(full.elements)
    for (let n = 0; n <= keys.length; n++) {
      const spec = {
        root: full.root,
        elements: Object.fromEntries(keys.slice(0, n).map((k) => [k, full.elements[k]!])),
      }
      await expect(renderToPptx(spec, { onWarn: () => {} })).resolves.toBeDefined()
      await expect(renderToDocx(spec, { onWarn: () => {} })).resolves.toBeDefined()
    }
  })
})
