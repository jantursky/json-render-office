/**
 * Writes the parts of the docs that come from the code, into docs/_generated, so they cannot drift:
 * the props tables and examples of every standard component, the default theme values and the
 * list of what the screenshot gallery verified. Run by `bun run generate`.
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { standardComponentDefinitions as docx } from 'json-render-docx/server'
import { standardComponentDefinitions as pptx } from 'json-render-pptx/server'
import { standardComponentDefinitions as report } from 'json-render-report/server'
import { z } from 'zod'

import { describeProps } from './json-schema.js'
import { renderDefaultThemes } from './themes.js'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const out = join(root, 'docs/_generated')

const PACKAGES = [
  { id: 'pptx', definitions: pptx },
  { id: 'docx', definitions: docx },
  { id: 'report', definitions: report },
]

const cell = (text) => text.replaceAll('|', '\\|').replaceAll('{', '\\{').replaceAll('<', '\\<')
const code = (text) => `\`${text.replaceAll('|', '\\|')}\``

async function readManifest() {
  try {
    return JSON.parse(await readFile(join(root, 'public/gallery/manifest.json'), 'utf8'))
  } catch {
    throw new Error('public/gallery/manifest.json is missing. Run `node scripts/gallery.js` from the repo root.')
  }
}

/** The catalog example with every prop present: the catalogs list only the props that matter. */
function fullExample(name, definition) {
  const shape = z.toJSONSchema(definition.props).properties
  const props = { ...Object.fromEntries(Object.keys(shape).map((key) => [key, null])), ...definition.example }
  const result = definition.props.safeParse(props)
  if (!result.success) throw new Error(`The example of ${name} is not valid: ${result.error.message}`)
  return { type: name, props, children: [] }
}

function section(packageId, name, definition, manifest) {
  const shot = manifest.shots[`${packageId}-${name}`]
  if (!shot) throw new Error(`No screenshot for ${packageId}-${name}. Run \`node scripts/gallery.js\`.`)
  const rows = describeProps(z.toJSONSchema(definition.props))
  const table =
    rows.length === 0
      ? 'This component has no props.'
      : [
          '| Prop | Type | Nullable | Description |',
          '| --- | --- | --- | --- |',
          ...rows.map((r) => `| ${code(r.name)} | ${code(r.type)} | ${r.nullable ? 'yes' : 'no'} | ${cell(r.text)} |`),
        ].join('\n')
  const children = definition.slots.length > 0 ? 'Takes child elements.' : 'Has no children: use `"children": []`.'

  return `## ${name}

${cell(definition.description)} ${children}

<Frame caption="${name} in LibreOffice ${manifest.libreOffice}.">
  <img src="/gallery/${shot.file}" alt="${name} rendered in LibreOffice" width="${shot.width}" height="${shot.height}" />
</Frame>

${table}

\`\`\`json
${JSON.stringify(fullExample(name, definition), null, 2)}
\`\`\`
`
}

function verified(manifest) {
  const rows = PACKAGES.map(({ id, definitions }) => {
    const names = Object.keys(definitions)
    return `| \`json-render-${id}\` | ${names.length} | ${names.map(code).join(', ')} |`
  })
  return `| Package | Components | Rendered and opened in LibreOffice ${manifest.libreOffice} |
| --- | --- | --- |
${rows.join('\n')}
`
}

const manifest = await readManifest()
await mkdir(join(out, 'components'), { recursive: true })
for (const { id, definitions } of PACKAGES) {
  const body = Object.entries(definitions)
    .map(([name, definition]) => section(id, name, definition, manifest))
    .join('\n')
  await writeFile(join(out, 'components', `${id}.md`), body)
}
await writeFile(join(out, 'verified.md'), verified(manifest))
await writeFile(join(out, 'themes.md'), await renderDefaultThemes())
