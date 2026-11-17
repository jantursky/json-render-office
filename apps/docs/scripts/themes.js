import { defaultTheme as docxTheme } from 'json-render-docx'
import { defaultTheme as pptxTheme } from 'json-render-pptx'

const COLOR_ROLES = {
  background: 'Slide background. Word pages stay white.',
  text: 'Body text. Slide titles use it too.',
  muted: 'Subtitles, slide numbers, and header and footer text.',
  heading: 'Title and headings in Word.',
  accent: 'Background of section slides.',
  onAccent: 'Text on section slides.',
  tableHeader: 'Background of the header row.',
  onTableHeader: 'Text in the header row of a table, in slides and in Word.',
  tableStripe: 'Every second row of a striped table.',
  rule: 'Table borders in Word.',
}

const table = (head, rows) =>
  [
    `| ${head.join(' | ')} |`,
    `| ${head.map(() => '---').join(' | ')} |`,
    ...rows.map((r) => `| ${r.join(' | ')} |`),
  ].join('\n')

const sizes = (theme) =>
  table(
    ['Size', 'Points'],
    Object.entries(theme.sizes).map(([key, value]) => [`\`${key}\``, String(value)]),
  )

/** The default theme values as three Markdown tables: shared colors, slide sizes and page sizes. */
export async function renderDefaultThemes() {
  const colors = Object.entries(pptxTheme.colors).map(([key, value]) => {
    const role = COLOR_ROLES[key]
    if (!role) throw new Error(`Describe the theme color "${key}" in scripts/themes.js.`)
    return [`\`${key}\``, `\`${value}\``, role]
  })
  return `${table(['Color', 'Default', 'Used for'], colors)}

Fonts: \`heading\` is \`${pptxTheme.fonts.heading}\` and \`body\` is \`${pptxTheme.fonts.body}\`. The series palette is ${pptxTheme.palette.map((c) => `\`${c}\``).join(', ')}.

### Slide sizes (json-render-pptx)

${sizes(pptxTheme)}

### Document sizes (json-render-docx)

${sizes(docxTheme)}
`
}
