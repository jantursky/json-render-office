import { z } from 'zod'

export const standardComponentDefinitions = {
  Report: {
    props: z.object({
      title: z
        .string()
        .max(90)
        .describe('The report title: the cover slide, the first line of the document and the page heading.'),
      subtitle: z.string().max(140).nullable(),
      author: z.string().max(80).nullable(),
    }),
    slots: ['default'],
    description: 'The report. Must be the root element. Children must be Chapter components.',
    example: { title: 'Quarterly review', subtitle: 'Q3 2026', author: 'Finance team' },
  },

  Chapter: {
    props: z.object({
      title: z.string().max(90).describe('Under 8 words. It is a slide title and a document heading.'),
      notes: z.string().max(2000).nullable().describe('Speaker notes on the slide. Ignored in the document.'),
    }),
    slots: ['default'],
    description:
      'One topic: a slide in the deck, a heading with its content in the document, a section on the web page. Keep it to one idea and about five blocks.',
    example: { title: 'Revenue grew 24%', notes: null },
  },

  Paragraph: {
    props: z.object({ text: z.string().max(600) }),
    slots: [],
    description: 'A paragraph of body text.',
    example: { text: 'Growth came mostly from the enterprise tier.' },
  },

  BulletList: {
    props: z.object({
      items: z.array(z.string().max(160)).min(1).max(7),
      ordered: z.boolean().nullable(),
    }),
    slots: [],
    description: 'A bulleted or numbered list. At most 6 items of about 12 words each fit a slide.',
    example: { items: ['Enterprise revenue up 31%', 'Churn down to 2.1%'], ordered: false },
  },

  Table: {
    props: z.object({
      columns: z.array(z.string().max(40)).min(1).max(6),
      rows: z
        .array(z.array(z.string().max(60)).max(6))
        .min(1)
        .max(10),
      striped: z.boolean().nullable(),
    }),
    slots: [],
    description: 'A table with a header row. At most 6 columns and 10 rows.',
    example: {
      columns: ['Region', 'Revenue'],
      rows: [
        ['EMEA', '$4.2M'],
        ['Americas', '$6.8M'],
      ],
    },
  },

  Chart: {
    props: z.object({
      type: z.enum(['bar', 'line', 'pie', 'doughnut', 'area']),
      title: z.string().max(80).nullable(),
      labels: z.array(z.string().max(30)).min(1).max(12),
      series: z
        .array(z.object({ name: z.string().max(40), values: z.array(z.number()).min(1).max(12) }))
        .min(1)
        .max(4)
        .describe('One value per label. Pie and doughnut charts use only the first series.'),
    }),
    slots: [],
    description:
      'A chart. Native and editable in the deck, a table of the same numbers in the Word document, an SVG chart on the web.',
    example: {
      type: 'bar',
      title: 'Revenue by quarter',
      labels: ['Q1', 'Q2', 'Q3', 'Q4'],
      series: [{ name: 'Revenue', values: [4.1, 4.8, 5.6, 6.9] }],
    },
  },

  Image: {
    props: z.object({
      src: z.string().describe('An https URL or a data: URI. Local paths are not allowed.'),
      alt: z.string().max(200),
    }),
    slots: [],
    description: 'A picture with alt text.',
    example: { src: 'https://picsum.photos/800/450?random=1', alt: 'A mountain lake at sunrise' },
  },
}

export type StandardComponentDefinitions = typeof standardComponentDefinitions

export type StandardComponentProps<K extends keyof StandardComponentDefinitions> = z.output<
  StandardComponentDefinitions[K]['props']
>
