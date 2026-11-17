import { standardComponents as pages } from 'json-render-docx'
import type { Component } from 'vue'

import { call, defineReport, element } from './element'

const part = (type: string): Component | undefined => pages[type]

/** A chart in a Word document is a table of its numbers: Word's own charts are not covered yet. */
export const chartAsTable = (labels: string[], series: { name: string; values: number[] }[]) => ({
  columns: ['', ...series.map((s) => s.name)],
  rows: labels.map((label, index) => [label, ...series.map((s) => String(s.values[index] ?? ''))]),
})

/** The report as a document: a title, then a Heading and the content for each Chapter. */
export const docxRegistry: Record<string, Component> = {
  Report: defineReport('Report', (p, children) =>
    call(part('Document'), element('Document', { title: p.title, author: p.author, language: null }), [
      call(part('Section'), element('Section', { size: null, orientation: null, margin: null }), [
        call(part('Title'), element('Title', { text: p.title, align: null })),
        ...(p.subtitle || p.author
          ? [
              call(
                part('Paragraph'),
                element('Paragraph', {
                  text: [p.subtitle, p.author].filter(Boolean).join('  ·  '),
                  align: null,
                  bold: null,
                  italic: null,
                  color: null,
                  fontSize: null,
                }),
              ),
            ]
          : []),
        ...children,
      ]),
    ]),
  ),
  Chapter: defineReport('Chapter', (p, children) => [
    call(part('Heading'), element('Heading', { text: p.title, level: 1 })),
    ...children,
  ]),
  Paragraph: defineReport('Paragraph', (p) =>
    call(
      part('Paragraph'),
      element('Paragraph', { text: p.text, align: null, bold: null, italic: null, color: null, fontSize: null }),
    ),
  ),
  BulletList: defineReport('BulletList', (p) =>
    call(part('List'), element('List', { items: p.items, ordered: p.ordered })),
  ),
  Table: defineReport('Table', (p) =>
    call(part('Table'), element('Table', { columns: p.columns, rows: p.rows, striped: p.striped })),
  ),
  Chart: defineReport('Chart', (p) => {
    const table = chartAsTable(p.labels, p.type === 'pie' || p.type === 'doughnut' ? p.series.slice(0, 1) : p.series)
    return [
      ...(p.title ? [call(part('Heading'), element('Heading', { text: p.title, level: 3 }))] : []),
      call(part('Table'), element('Table', { ...table, striped: true })),
    ]
  }),
  Image: defineReport('Image', (p) => call(part('Image'), element('Image', { src: p.src, alt: p.alt, width: null }))),
}
