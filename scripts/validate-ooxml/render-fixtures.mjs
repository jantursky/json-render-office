// Renders the fixture specs from the built packages into a directory, for the Open XML SDK
// validator (see Program.cs). Run after `bun run build`:
//   node scripts/validate-ooxml/render-fixtures.mjs <output directory>
//
// The report spec is the one the report tests use. It is imported as TypeScript, which Node 22.19+
// strips on its own. The deck and document specs cover what the report does not: slide layouts,
// speaker notes, headers, footers and page numbers.
import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

import { reportSpec } from '../../packages/json-render-report/test/helpers.ts'

const [outDir] = process.argv.slice(2)
if (!outDir) {
  console.error('Usage: node render-fixtures.mjs <output directory>')
  process.exit(2)
}

const packages = resolve(import.meta.dirname, '../../packages')
const load = (name) => import(pathToFileURL(resolve(packages, name, 'dist/index.js')).href)
const { renderToDocx, renderToPptx } = await load('json-render-report')
const pptx = await load('json-render-pptx')
const docx = await load('json-render-docx')

const deck = {
  root: 'deck',
  elements: {
    deck: { type: 'Deck', props: { title: 'Review', author: null, subject: null }, children: ['cover', 'content'] },
    cover: {
      type: 'Slide',
      props: { layout: 'title', background: null, notes: 'Welcome everyone.', slideNumber: null },
      children: ['coverTitle', 'coverSub'],
    },
    coverTitle: { type: 'Title', props: { text: 'Quarterly review', align: null, color: null }, children: [] },
    coverSub: { type: 'Subtitle', props: { text: 'Q3 2026', align: null, color: null }, children: [] },
    content: {
      type: 'Slide',
      props: { layout: null, background: null, notes: null, slideNumber: null },
      children: ['title', 'bullets'],
    },
    title: { type: 'Title', props: { text: 'What changed', align: null, color: null }, children: [] },
    bullets: {
      type: 'BulletList',
      props: { items: ['Revenue up 24%', 'Churn down', 'Two regions'], ordered: null, fontSize: null, color: null },
      children: [],
    },
  },
}

const doc = {
  root: 'doc',
  elements: {
    doc: { type: 'Document', props: { title: 'Report', author: 'Jane Doe', language: 'en-US' }, children: ['section'] },
    section: {
      type: 'Section',
      props: { size: null, orientation: null, margin: null },
      children: ['header', 'footer', 'title', 'h1', 'list', 'table', 'break', 'h2'],
    },
    header: { type: 'Header', props: { text: 'Project report', align: null }, children: [] },
    footer: { type: 'Footer', props: { text: 'Confidential', pageNumbers: true, align: null }, children: [] },
    title: { type: 'Title', props: { text: 'Quarterly report', align: null }, children: [] },
    h1: { type: 'Heading', props: { text: 'Summary', level: 1 }, children: [] },
    list: { type: 'List', props: { items: ['Faster checkout', 'Better search'], ordered: null }, children: [] },
    table: {
      type: 'Table',
      props: { columns: ['Team', 'Owner'], rows: [['Checkout', 'Mira']], striped: true },
      children: [],
    },
    break: { type: 'PageBreak', props: {}, children: [] },
    h2: { type: 'Heading', props: { text: 'Appendix', level: 2 }, children: [] },
  },
}

mkdirSync(outDir, { recursive: true })
const files = {
  'report.pptx': await renderToPptx(reportSpec()),
  'report.docx': await renderToDocx(reportSpec()),
  'deck.pptx': await pptx.renderToBuffer(deck),
  'document.docx': await docx.renderToBuffer(doc),
}
for (const [name, bytes] of Object.entries(files)) {
  writeFileSync(resolve(outDir, name), bytes)
  console.log(`${name}: ${bytes.length} bytes`)
}
