import { COMMON_RULES, defineOfficeSchema } from 'json-render-office'

/** The schema for json-render-report: one spec for the web page, the deck and the Word document. */
export const schema = defineOfficeSchema([
  'The root element MUST be a Report component. Its children MUST be Chapter components.',
  'A Chapter is one idea. Start with the point as the Chapter title, then add a Paragraph, a BulletList, a Table, a Chart or an Image.',
  'The same spec becomes slides and pages, so keep text short: at most 6 bullets, about 12 words per bullet and 8 words per title.',
  'Write text in Paragraph, BulletList or the title props. Raw strings are not supported.',
  'Table rows must have exactly one string per column. Chart series must have one value per label.',
  ...COMMON_RULES,
])

export type ReportSchema = typeof schema
