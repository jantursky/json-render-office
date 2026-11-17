import type { Spec, UIElement } from '@json-render/core'

type Props = Record<string, unknown>

/** Small builders so the fixed example specs read like the reports they describe. */
export const element = (type: string, props: Props, children: string[] = []): UIElement => ({ type, props, children })

export const paragraph = (text: string): UIElement => element('Paragraph', { text })

export const bullets = (items: string[], ordered = false): UIElement => element('BulletList', { items, ordered })

export const table = (columns: string[], rows: string[][]): UIElement =>
  element('Table', { columns, rows, striped: true })

export const chart = (
  type: 'bar' | 'line' | 'pie' | 'doughnut' | 'area',
  title: string,
  labels: string[],
  series: { name: string; values: number[] }[],
): UIElement => element('Chart', { type, title, labels, series })

export interface ChapterInput {
  title: string
  notes?: string
  blocks: UIElement[]
}

export interface ReportInput {
  title: string
  subtitle: string
  author: string
  chapters: ChapterInput[]
}

/** Lays a report out as a flat json-render spec: one Report, its Chapters, then their blocks. */
export function report({ title, subtitle, author, chapters }: ReportInput): Spec {
  const rest: Record<string, UIElement> = {}
  const chapterKeys = chapters.map((chapter, index) => {
    const key = `chapter-${index + 1}`
    const blockKeys = chapter.blocks.map((block, blockIndex) => {
      const blockKey = `${key}-block-${blockIndex + 1}`
      rest[blockKey] = block
      return blockKey
    })
    rest[key] = element('Chapter', { title: chapter.title, notes: chapter.notes ?? null }, blockKeys)
    return key
  })
  return { root: 'report', elements: { report: element('Report', { title, subtitle, author }, chapterKeys), ...rest } }
}
