import type { Spec } from '@json-render/core'
import { strFromU8, unzipSync } from 'fflate'

import { renderToBuffer, type RenderOptions, type RenderWarning } from '../src'

export interface Rendered {
  files: Record<string, Uint8Array>
  /** The text of one part of the package, such as `ppt/slides/slide1.xml`. */
  xml: (path: string) => string
  /** The text of the only part whose path matches. */
  part: (pattern: RegExp) => string
  warnings: RenderWarning[]
}

export async function render(spec: Spec, options: RenderOptions = {}): Promise<Rendered> {
  const warnings: RenderWarning[] = []
  const bytes = await renderToBuffer(spec, { ...options, onWarn: (w) => warnings.push(w) })
  const files = unzipSync(bytes)
  return {
    files,
    warnings,
    part: (pattern) => {
      const paths = Object.keys(files).filter((f) => pattern.test(f))
      if (paths.length !== 1) throw new Error(`Expected one part matching ${pattern}, found: ${paths.join(', ')}`)
      return strFromU8(files[paths[0]!]!)
    },
    xml: (path) => {
      const file = files[path]
      if (!file) throw new Error(`No ${path} in the package. Has: ${Object.keys(files).join(', ')}`)
      return strFromU8(file)
    },
  }
}

const text = (value: string, extra: Record<string, unknown> = {}) => ({
  type: 'Paragraph',
  props: { text: value, align: null, bold: null, italic: null, color: null, fontSize: null, ...extra },
  children: [],
})

export const PNG =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='

export const docSpec = (): Spec => ({
  root: 'doc',
  elements: {
    doc: {
      type: 'Document',
      props: { title: 'Report', author: 'Jane Doe', language: 'en-US' },
      children: ['section'],
    },
    section: {
      type: 'Section',
      props: { size: null, orientation: null, margin: null },
      children: ['header', 'footer', 'title', 'h1', 'p', 'list', 'table', 'break', 'h2'],
    },
    header: { type: 'Header', props: { text: 'Project report', align: null }, children: [] },
    footer: { type: 'Footer', props: { text: 'Confidential', pageNumbers: true, align: null }, children: [] },
    title: { type: 'Title', props: { text: 'Quarterly report', align: null }, children: [] },
    h1: { type: 'Heading', props: { text: 'Summary', level: 1 }, children: [] },
    p: text('Revenue grew in every quarter.'),
    list: { type: 'List', props: { items: ['Faster checkout', 'Better search'], ordered: null }, children: [] },
    table: {
      type: 'Table',
      props: {
        columns: ['Team', 'Owner'],
        rows: [
          ['Checkout', 'Mira'],
          ['Search', 'Tomas'],
        ],
        striped: true,
      },
      children: [],
    },
    break: { type: 'PageBreak', props: {}, children: [] },
    h2: { type: 'Heading', props: { text: 'Appendix', level: 2 }, children: [] },
  },
})
