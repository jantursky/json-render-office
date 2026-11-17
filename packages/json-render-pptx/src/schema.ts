import { defineSchema } from '@json-render/core'

/**
 * The schema for json-render-pptx.
 *
 * Same flat `{ root, elements }` spec as the first-party renderers, so a catalog built here can be
 * given to a model and validated with the usual json-render tools.
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
      'The root element MUST be a Deck component. Its children MUST be Slide components.',
      'Slides never use coordinates. Pick a Slide layout and add Title, Subtitle, Text and BulletList children in reading order.',
      'Every slide needs a Title, except slides with layout "blank".',
      'Keep slides short: at most 6 bullets per BulletList, about 12 words per bullet and 8 words per Title.',
      'All text must be in Title, Subtitle, Text or BulletList components. Raw strings are not supported.',
      'Colors are hex strings such as "#1f2937". Leave a color null to use the theme.',
      'CRITICAL INTEGRITY CHECK: if an element has children: ["a", "b"], elements "a" and "b" MUST exist.',
      'REQUIRED FIELDS: every element MUST include a "children" array. Leaf elements use an empty array: "children": [].',
    ],
  },
)

export type PptxSchema = typeof schema
