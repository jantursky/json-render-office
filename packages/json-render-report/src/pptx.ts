import { standardComponents as slides } from 'json-render-pptx'
import type { Component } from 'vue'

import { call, defineReport, element } from './element'

const part = (type: string): Component | undefined => slides[type]

const slide = (props: Record<string, unknown>, children: Parameters<typeof call>[2]) =>
  call(
    part('Slide'),
    element('Slide', { layout: null, background: null, notes: null, slideNumber: null, ...props }),
    children,
  )

const title = (text: string) => call(part('Title'), element('Title', { text, align: null, color: null }))

/** The report as slides: a cover, then one slide per Chapter. Register these with `json-render-pptx`. */
export const pptxRegistry: Record<string, Component> = {
  Report: defineReport('Report', (p, children) =>
    call(part('Deck'), element('Deck', { title: p.title, author: p.author, subject: null }), [
      slide({ layout: 'title' }, [
        title(p.title),
        ...(p.subtitle || p.author
          ? [
              call(
                part('Subtitle'),
                element('Subtitle', {
                  text: [p.subtitle, p.author].filter(Boolean).join('  ·  '),
                  align: null,
                  color: null,
                }),
              ),
            ]
          : []),
      ]),
      ...children,
    ]),
  ),
  Chapter: defineReport('Chapter', (p, children) =>
    slide({ notes: p.notes, slideNumber: true }, [title(p.title), ...children]),
  ),
  Paragraph: defineReport('Paragraph', (p) =>
    call(
      part('Text'),
      element('Text', { text: p.text, fontSize: null, bold: null, italic: null, align: null, color: null }),
    ),
  ),
  BulletList: defineReport('BulletList', (p) =>
    call(
      part('BulletList'),
      element('BulletList', { items: p.items, ordered: p.ordered, fontSize: null, color: null }),
    ),
  ),
  Table: defineReport('Table', (p) =>
    call(part('Table'), element('Table', { columns: p.columns, rows: p.rows, fontSize: null, striped: p.striped })),
  ),
  Chart: defineReport('Chart', (p) =>
    call(
      part('Chart'),
      element('Chart', { type: p.type, title: p.title, labels: p.labels, series: p.series, legend: null }),
    ),
  ),
  Image: defineReport('Image', (p) => call(part('Image'), element('Image', { src: p.src, alt: p.alt }))),
}
