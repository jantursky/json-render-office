import { COMMON_RULES, defineOfficeSchema } from 'json-render-office'

/**
 * The schema for json-render-docx.
 *
 * Same flat `{ root, elements }` spec as the first-party renderers, so a catalog built here can be
 * given to a model and validated with the usual json-render tools.
 */
export const schema = defineOfficeSchema([
  'The root element MUST be a Document component. Its children MUST be Section components.',
  'Put Header and Footer first inside a Section, then the content: Title, Heading, Paragraph, List, Table, Image, PageBreak and TableOfContents.',
  'Use Heading level 1 for chapters, 2 for sections and 3 for subsections. Do not skip levels.',
  'Write text in Paragraph, Heading, Title or List components. Raw strings are not supported.',
  'Table rows must have exactly one string per column. Keep tables to 6 columns.',
  'Sizes of images are inches. A portrait page has about 6.5 inches of text width.',
  ...COMMON_RULES,
])

export type DocxSchema = typeof schema
