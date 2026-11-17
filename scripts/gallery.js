/**
 * Renders a fixed spec per standard component with the built packages, opens the files in
 * LibreOffice, and saves a screenshot of each to apps/docs/public/gallery. It also writes
 * manifest.json and README.txt there with the LibreOffice version the screenshots were checked on.
 *
 * Needs: the packages built (`bun run build`), `soffice`, `pdftoppm` (poppler) and `magick` (ImageMagick).
 * Usage: node scripts/gallery.js
 */
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import * as docx from '../packages/json-render-docx/dist/index.js'
import * as pptx from '../packages/json-render-pptx/dist/index.js'
import * as report from '../packages/json-render-report/dist/index.js'
import { docxCases } from './gallery/docx.js'
import { compose, crop, samplePicture } from './gallery/images.js'
import { libreOfficeVersion, rasterize, requireTools, toPdf } from './gallery/office.js'
import { pptxCases } from './gallery/pptx.js'
import { oneSpec, reportCases } from './gallery/report.js'
import { toSpec } from './gallery/tree.js'
import { screenshotWeb } from './gallery/web.js'

const outDir = join(dirname(fileURLToPath(import.meta.url)), '../apps/docs/public/gallery')

/** How each package turns a spec into the bytes of the file LibreOffice opens. */
const writers = {
  pptx: { extension: 'pptx', render: pptx.renderToBuffer, validate: pptx.validateProps },
  docx: { extension: 'docx', render: docx.renderToBuffer, validate: docx.validateProps },
  'report-pptx': { extension: 'pptx', render: report.renderToPptx, validate: report.validateProps },
  'report-docx': { extension: 'docx', render: report.renderToDocx, validate: report.validateProps },
}

async function main() {
  await requireTools()
  const picture = await samplePicture()
  const prefixed = (prefix, defaults) => (c) => ({ ...defaults, ...c, id: `${prefix}-${c.name}` })
  const cases = [
    ...pptxCases(picture).map(prefixed('pptx', { writer: 'pptx', crop: 'none', pages: [1] })),
    ...docxCases(picture).map(prefixed('docx', { writer: 'docx', pages: [1] })),
    // A report component is drawn as the slide it becomes: the cover is page 1, the first Chapter page 2.
    ...reportCases(picture).map(prefixed('report', { writer: 'report-pptx', crop: 'none', pages: [2] })),
    {
      id: 'one-spec-pptx',
      tree: oneSpec(picture),
      writer: 'report-pptx',
      crop: 'none',
      pages: [1, 2, 3, 4],
      tile: '2x2',
    },
    { id: 'one-spec-docx', tree: oneSpec(picture), writer: 'report-docx', crop: 'trim', pages: [1, 2], tile: '2x1' },
  ]

  const work = await mkdtemp(join(tmpdir(), 'json-render-gallery-'))
  try {
    const files = []
    for (const item of cases) {
      const writer = writers[item.writer]
      const spec = toSpec(item.tree)
      const issues = writer.validate(spec)
      if (issues.length > 0) throw new Error(`${item.id} is not a valid spec: ${JSON.stringify(issues)}`)
      const warnings = []
      const bytes = await writer.render(spec, { onWarn: (w) => warnings.push(w) })
      if (warnings.length > 0) throw new Error(`${item.id} rendered with warnings: ${JSON.stringify(warnings)}`)
      const file = join(work, `${item.id}.${writer.extension}`)
      await writeFile(file, bytes)
      files.push(file)
    }
    await toPdf(files, work)

    await mkdir(outDir, { recursive: true })
    const shots = {}
    for (const item of cases) {
      const pages = await rasterize(join(work, `${item.id}.pdf`), work, item.id)
      const picked = item.pages.map((number) => {
        const page = pages[number - 1]
        if (!page) throw new Error(`${item.id} has ${pages.length} pages, not ${number}.`)
        return page
      })
      for (const page of picked) await crop(page, item.crop)
      const file = `${item.id}.png`
      shots[item.id] = { file, ...(await compose(picked, item.tile, join(outDir, file))) }
      console.log(
        `${file}  ${shots[item.id].width}x${shots[item.id].height}  ${Math.round(shots[item.id].bytes / 1024)} KB`,
      )
    }

    shots['one-spec-web'] = {
      file: 'one-spec-web.png',
      ...(await screenshotWeb(toSpec(oneSpec(picture)), join(outDir, 'one-spec-web.png'))),
    }

    const libreOffice = await libreOfficeVersion()
    await writeFile(join(outDir, 'manifest.json'), `${JSON.stringify({ libreOffice, shots }, null, 2)}\n`)
    await writeFile(join(outDir, 'README.txt'), readme(libreOffice))
    console.log(`Checked on LibreOffice ${libreOffice}`)
  } finally {
    await rm(work, { recursive: true, force: true })
  }
}

const readme = (libreOffice) => `Screenshots of the standard components, made by \`node scripts/gallery.js\`.

Checked on LibreOffice ${libreOffice}.

Each spec is rendered with the built packages, opened by \`soffice --headless --convert-to pdf\`
and rasterized with \`pdftoppm -r 80\`. one-spec-web.png is the web renderer, drawn in Chromium.
Only LibreOffice was used. Nothing here was opened in Microsoft Word, Microsoft PowerPoint,
Keynote or Google Docs and Slides, so those are unverified.

manifest.json lists every file with its size and the LibreOffice version. The docs build reads it.
`

await main()
