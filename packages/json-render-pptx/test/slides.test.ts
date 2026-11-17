import { describe, expect, it } from 'vitest'

import { deckSpec, render } from './helpers'

describe('Deck and Slide', () => {
  it('writes one slide part per Slide', async () => {
    const out = await render(deckSpec())
    expect(Object.keys(out.files).filter((f) => /^ppt\/slides\/slide\d+\.xml$/.test(f))).toHaveLength(2)
    expect(out.warnings).toEqual([])
  })

  it('writes the deck title into the document properties', async () => {
    const out = await render(deckSpec())
    expect(out.xml('docProps/core.xml')).toContain('<dc:title>Review</dc:title>')
  })

  it('keeps notes on the slide that has them', async () => {
    const out = await render(deckSpec())
    expect(out.xml('ppt/notesSlides/notesSlide1.xml')).toContain('Welcome everyone.')
  })
})

describe('Title, Subtitle and BulletList', () => {
  it('writes editable text, not pictures', async () => {
    const out = await render(deckSpec())
    const slide1 = out.xml('ppt/slides/slide1.xml')
    expect(slide1).toContain('Quarterly review')
    expect(slide1).toContain('Q3 2026')
    expect(slide1).not.toContain('<p:pic>')
  })

  it('writes one bulleted paragraph per item', async () => {
    const out = await render(deckSpec())
    const slide2 = out.xml('ppt/slides/slide2.xml')
    for (const item of ['Revenue up 24%', 'Churn down', 'Two regions']) expect(slide2).toContain(item)
    expect(slide2.match(/<a:buChar/g)).toHaveLength(3)
  })

  it('uses theme colors and fonts', async () => {
    const out = await render(deckSpec(), {
      theme: { fonts: { heading: 'Georgia' }, colors: { background: '#F5F5F5' } },
    })
    expect(out.xml('ppt/slides/slide2.xml')).toContain('Georgia')
    expect(out.xml('ppt/slides/slide2.xml')).toContain('F5F5F5')
  })
})
