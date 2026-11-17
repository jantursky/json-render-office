import { z } from 'zod'

const align = z.enum(['left', 'center', 'right', 'justify']).nullable()
const color = z.string().nullable()

export const standardComponentDefinitions = {
  Document: {
    props: z.object({
      title: z.string().nullable().describe('File title shown in document properties.'),
      author: z.string().nullable(),
      language: z.string().nullable().describe('BCP 47 tag such as "en-US", so Word checks spelling in it.'),
    }),
    slots: ['default'],
    description: 'The Word document. Must be the root element. Children must be Section components.',
    example: { title: 'Project report', author: 'Jane Doe', language: 'en-US' },
  },

  Section: {
    props: z.object({
      size: z.enum(['A4', 'Letter', 'A3', 'A5', 'Legal']).nullable().describe('Page size. Default A4.'),
      orientation: z.enum(['portrait', 'landscape']).nullable(),
      margin: z.number().min(0.25).max(3).nullable().describe('Page margin in inches. Default 1.'),
    }),
    slots: ['default'],
    description:
      'A run of pages with one page setup. Most documents have one Section. Children are the page header and footer, then the content.',
    example: { size: 'A4', orientation: 'portrait', margin: 1 },
  },

  Header: {
    props: z.object({ text: z.string().max(120), align: align.describe('Default right.') }),
    slots: [],
    description: 'Text repeated at the top of every page of the Section. Put it first in the Section.',
    example: { text: 'Project report', align: 'right' },
  },

  Footer: {
    props: z.object({
      text: z.string().max(120).nullable(),
      pageNumbers: z.boolean().nullable().describe('Add "Page X of Y" after the text.'),
      align: align.describe('Default center.'),
    }),
    slots: [],
    description: 'Text and page numbers repeated at the bottom of every page of the Section.',
    example: { text: 'Confidential', pageNumbers: true },
  },

  Title: {
    props: z.object({ text: z.string().max(120), align }),
    slots: [],
    description: 'The document title, once, at the top of the first page.',
    example: { text: 'Quarterly report' },
  },

  Heading: {
    props: z.object({
      text: z.string().max(120),
      level: z.number().int().min(1).max(3).describe('1 is a chapter, 3 the smallest.'),
    }),
    slots: [],
    description: 'A heading. Word lists headings in its navigation pane and in a TableOfContents.',
    example: { text: 'Results', level: 1 },
  },

  Paragraph: {
    props: z.object({
      text: z.string().max(3000).describe('A line feed in the text starts a new line.'),
      align,
      bold: z.boolean().nullable(),
      italic: z.boolean().nullable(),
      color,
      fontSize: z.number().min(8).max(28).nullable().describe('Points. Null uses the theme size.'),
    }),
    slots: [],
    description: 'A paragraph of body text.',
    example: { text: 'Revenue grew in every quarter.' },
  },

  List: {
    props: z.object({
      items: z.array(z.string().max(300)).min(1).max(30),
      ordered: z.boolean().nullable().describe('Numbered instead of bulleted.'),
    }),
    slots: [],
    description: 'A bulleted or numbered list.',
    example: { items: ['Faster checkout', 'Better search'], ordered: false },
  },

  Table: {
    props: z.object({
      columns: z.array(z.string().max(40)).min(1).max(6).describe('Header labels, one per column.'),
      rows: z
        .array(z.array(z.string().max(200)).max(6))
        .min(1)
        .max(60)
        .describe('One string per column in each row.'),
      striped: z.boolean().nullable().describe('Shade every second row.'),
    }),
    slots: [],
    description: 'A native table with a header row that repeats on every page the table spans.',
    example: {
      columns: ['Team', 'Owner'],
      rows: [
        ['Checkout', 'Mira'],
        ['Search', 'Tomas'],
      ],
    },
  },

  Image: {
    props: z.object({
      src: z.string().describe('An https URL or a data: URI. Local paths are not allowed.'),
      alt: z.string().max(200).describe('What the image shows, for screen readers.'),
      width: z.number().min(0.5).max(6.5).nullable().describe('Inches. Default 5.'),
    }),
    slots: [],
    description: 'A centered picture. Always give alt text.',
    example: { src: 'https://picsum.photos/800/450?random=1', alt: 'A mountain lake', width: 5 },
  },

  PageBreak: {
    props: z.object({}),
    slots: [],
    description: 'Starts the next element on a new page.',
    example: {},
  },

  TableOfContents: {
    props: z.object({
      title: z.string().max(60).nullable(),
      maxLevel: z.number().int().min(1).max(3).nullable().describe('Deepest heading level to list. Default 3.'),
    }),
    slots: [],
    description: 'A table of contents built from the headings. Word fills in the page numbers when the file opens.',
    example: { title: 'Contents', maxLevel: 2 },
  },
}

export type StandardComponentDefinitions = typeof standardComponentDefinitions

export type StandardComponentProps<K extends keyof StandardComponentDefinitions> = z.output<
  StandardComponentDefinitions[K]['props']
>
