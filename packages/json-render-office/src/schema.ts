import { defineSchema } from '@json-render/core'

/**
 * The json-render schema every Office catalog shares: the flat `{ root, elements }` spec of the
 * first-party renderers, plus the rules the model sees in its prompt.
 */
export const defineOfficeSchema = (defaultRules: string[]) =>
  defineSchema(
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
    { defaultRules },
  )

/** Rules every Office catalog needs, whatever the output. */
export const COMMON_RULES = [
  'Colors are hex strings such as "#1f2937". Leave a color null to use the theme.',
  'CRITICAL INTEGRITY CHECK: if an element has children: ["a", "b"], elements "a" and "b" MUST exist.',
  'REQUIRED FIELDS: every element MUST include a "children" array. Leaf elements use an empty array: "children": [].',
]
