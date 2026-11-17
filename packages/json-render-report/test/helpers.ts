import type { Spec } from '@json-render/core'
import { strFromU8, unzipSync } from 'fflate'

export const PNG =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='

export const reportSpec = (): Spec => ({
  root: 'report',
  elements: {
    report: {
      type: 'Report',
      props: { title: 'Quarterly review', subtitle: 'Q3 2026', author: 'Finance team' },
      children: ['c1', 'c2'],
    },
    c1: {
      type: 'Chapter',
      props: { title: 'Revenue grew 24%', notes: 'Say thanks.' },
      children: ['p', 'list', 'chart'],
    },
    p: { type: 'Paragraph', props: { text: 'Growth came from enterprise.' }, children: [] },
    list: { type: 'BulletList', props: { items: ['Enterprise up 31%', 'Churn down'], ordered: null }, children: [] },
    chart: {
      type: 'Chart',
      props: {
        type: 'bar',
        title: 'Revenue by quarter',
        labels: ['Q1', 'Q2', 'Q3'],
        series: [{ name: 'Revenue', values: [4, 5, 7] }],
      },
      children: [],
    },
    c2: { type: 'Chapter', props: { title: 'Regions', notes: null }, children: ['table', 'img'] },
    table: {
      type: 'Table',
      props: {
        columns: ['Region', 'Revenue'],
        rows: [
          ['EMEA', '$4.2M'],
          ['Americas', '$6.8M'],
        ],
        striped: true,
      },
      children: [],
    },
    img: { type: 'Image', props: { src: PNG, alt: 'A pixel' }, children: [] },
  },
})

export const unzip = (bytes: Uint8Array) => {
  const files = unzipSync(bytes)
  return {
    files,
    xml: (path: string): string => {
      const file = files[path]
      if (!file) throw new Error(`No ${path}. Has: ${Object.keys(files).join(', ')}`)
      return strFromU8(file)
    },
    names: (pattern: RegExp): string[] => Object.keys(files).filter((f) => pattern.test(f)),
  }
}
