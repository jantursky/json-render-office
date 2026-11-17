import { COMMON_RULES, defineOfficeSchema } from 'json-render-office'

/**
 * The schema for json-render-pptx.
 *
 * Same flat `{ root, elements }` spec as the first-party renderers, so a catalog built here can be
 * given to a model and validated with the usual json-render tools.
 */
export const schema = defineOfficeSchema([
  'The root element MUST be a Deck component. Its children MUST be Slide components.',
  'Slides never use coordinates. Pick a Slide layout and add Title, Subtitle, Text and BulletList children in reading order.',
  'To put content side by side, add a Columns element with two or three Column children.',
  'Every slide needs a Title, except slides with layout "blank".',
  'Keep slides short: at most 6 bullets per BulletList, about 12 words per bullet and 8 words per Title.',
  'All text must be in Title, Subtitle, Text or BulletList components. Raw strings are not supported.',
  ...COMMON_RULES,
])

export type PptxSchema = typeof schema
