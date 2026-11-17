import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { afterAll, describe, expect, it } from 'vitest'

import { renderToDocx, renderToPptx } from '../src'
import { reportSpec } from './helpers'

/**
 * LibreOffice as a test oracle: if it can open the files and lay them out, they are well formed
 * enough for an Office reader. Never used at runtime. Run with `ORACLE=1 bun run test:oracle`.
 */
const dir = process.env.ORACLE ? mkdtempSync(join(tmpdir(), 'jr-oracle-')) : ''
afterAll(() => {
  if (dir) rmSync(dir, { recursive: true, force: true })
})

const pages = (pdf: string): number => {
  const out = execFileSync('pdfinfo', [pdf], { encoding: 'utf8' })
  return Number(/^Pages:\s+(\d+)/m.exec(out)?.[1])
}

const convert = (file: string): string => {
  execFileSync('soffice', ['--headless', '--convert-to', 'pdf', '--outdir', dir, file], {
    stdio: 'ignore',
    timeout: 120_000,
  })
  return file.replace(/\.\w+$/, '.pdf')
}

describe.skipIf(!process.env.ORACLE)('LibreOffice opens the generated files', () => {
  it('lays out the deck: a cover and one slide per chapter', async () => {
    const file = join(dir, 'report.pptx')
    writeFileSync(file, await renderToPptx(reportSpec()))
    const pdf = convert(file)
    expect(readFileSync(pdf).subarray(0, 4).toString()).toBe('%PDF')
    expect(pages(pdf)).toBe(3)
  })

  it('lays out the document', async () => {
    const file = join(dir, 'report.docx')
    writeFileSync(file, await renderToDocx(reportSpec()))
    const pdf = convert(file)
    expect(readFileSync(pdf).subarray(0, 4).toString()).toBe('%PDF')
    expect(pages(pdf)).toBeGreaterThanOrEqual(1)
  })
})
