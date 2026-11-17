import { defineSchema } from '@json-render/core'

/**
 * The schema for json-render-docx.
 *
 * Same flat `{ root, elements }` spec as the first-party renderers.
 */
export const schema = defineSchema(
  (s) => ({
    spec: s.object({
      root: s.string(),
      elements: s.record(
        s.object({
          type: s.ref('catalog.components'),
          props: s.propsOf('catalog.components'),
          children: s.array(s.string()),
          visible: { ...s.any(), ...s.optional() },
          repeat: { ...s.any(), ...s.optional() },
        }),
      ),
    }),

    catalog: s.object({
      components: s.map({
        props: s.zod(),
        slots: s.array(s.string()),
        description: s.string(),
        example: s.any(),
      }),
    }),
  }),
  {
    defaultRules: [
      'The root element MUST be a Document component. Its children MUST be Section components.',
      'Put Header and Footer first inside a Section, then the content: Title, Heading, Paragraph, List, Table, Image, PageBreak and TableOfContents.',
      'Use Heading level 1 for chapters, 2 for sections and 3 for subsections. Do not skip levels.',
      'Write text in Paragraph, Heading, Title or List components. Raw strings are not supported.',
      'Table rows must have exactly one string per column. Keep tables to 6 columns.',
      'Colors are hex strings such as "#1f2937". Leave a color null to use the theme.',
      'Sizes of images are inches. A portrait page has about 6.5 inches of text width.',
      'CRITICAL INTEGRITY CHECK: if an element has children: ["a", "b"], elements "a" and "b" MUST exist.',
      'REQUIRED FIELDS: every element MUST include a "children" array. Leaf elements use an empty array: "children": [].',
    ],
  },
)

export type DocxSchema = typeof schema
