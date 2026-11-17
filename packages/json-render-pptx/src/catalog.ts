import { z } from 'zod'

const align = z.enum(['left', 'center', 'right']).nullable()
const color = z.string().nullable()

/** The slide layouts a model can pick. Each places its children without coordinates. */
export const SLIDE_LAYOUTS = ['title', 'title-content', 'section', 'blank'] as const

export const standardComponentDefinitions = {
  Deck: {
    props: z.object({
      title: z.string().nullable().describe('File title shown in document properties.'),
      author: z.string().nullable(),
      subject: z.string().nullable(),
    }),
    slots: ['default'],
    description: 'The presentation. Must be the root element. Children must be Slide components.',
    example: { title: 'Quarterly review', author: 'Finance team' },
  },

  Slide: {
    props: z.object({
      layout: z
        .enum(SLIDE_LAYOUTS)
        .nullable()
        .describe(
          '"title": cover slide, content centered. "title-content": a Title followed by content, the default. "section": a divider with an accent background. "blank": no padding.',
        ),
      background: color.describe('Hex background color. Null uses the theme.'),
      notes: z.string().max(2000).nullable().describe('Speaker notes.'),
    }),
    slots: ['default'],
    description: 'One slide. Children are stacked top to bottom in reading order. Put the Title first.',
    example: { layout: 'title-content' },
  },

  Title: {
    props: z.object({
      text: z.string().max(90),
      align,
      color,
    }),
    slots: [],
    description: 'The slide heading. Keep it under 8 words.',
    example: { text: 'Revenue grew 24% year over year' },
  },

  Subtitle: {
    props: z.object({
      text: z.string().max(140),
      align,
      color,
    }),
    slots: [],
    description: 'A line of text under the Title, mostly on cover and section slides.',
    example: { text: 'Q3 2026 business review' },
  },

  Text: {
    props: z.object({
      text: z.string().max(600),
      fontSize: z.number().min(10).max(40).nullable().describe('Points. Null uses the theme size.'),
      bold: z.boolean().nullable(),
      italic: z.boolean().nullable(),
      align,
      color,
    }),
    slots: [],
    description: 'A paragraph of body text.',
    example: { text: 'Growth came mostly from the enterprise tier.' },
  },

  BulletList: {
    props: z.object({
      items: z.array(z.string().max(160)).min(1).max(7),
      ordered: z.boolean().nullable().describe('Numbered instead of bulleted.'),
      fontSize: z.number().min(10).max(32).nullable().describe('Points. Null uses the theme size.'),
      color,
    }),
    slots: [],
    description: 'A bulleted or numbered list. At most 6 items of about 12 words each fit well.',
    example: { items: ['Enterprise revenue up 31%', 'Churn down to 2.1%', 'Two new regions launched'] },
  },
}

export type StandardComponentDefinitions = typeof standardComponentDefinitions

export type StandardComponentProps<K extends keyof StandardComponentDefinitions> = z.output<
  StandardComponentDefinitions[K]['props']
>
