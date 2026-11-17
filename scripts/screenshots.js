// Builds the demo, serves the build and captures the README screenshots into .github/assets:
// the generator with a finished report, and the spec panel, each at 1280×800 (device scale 2)
// in light and dark. Re-run with `bun run screenshots` whenever the demo's look changes.
// Needs ImageMagick (`magick`) to shrink the PNGs.
import { execFileSync, execSync } from 'node:child_process'
import { mkdirSync, readFileSync, statSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

import { chromium } from 'playwright'

const root = join(import.meta.dirname, '..')
const dist = join(root, 'apps/example/dist')
const out = join(root, '.github/assets')
const viewport = { width: 1280, height: 800 }
const THEME_KEY = 'report-generator-theme'

const types = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
}

/** Serves the built demo on a free port; unknown paths fall back to index.html. */
const serve = () =>
  new Promise((resolve) => {
    const server = createServer((request, response) => {
      const path = decodeURIComponent(new URL(request.url ?? '/', 'http://localhost').pathname)
      let file = join(dist, path)
      if (!file.startsWith(dist) || !statSync(file, { throwIfNoEntry: false })?.isFile()) file = join(dist, 'index.html')
      response.writeHead(200, { 'content-type': types[extname(file)] ?? 'application/octet-stream' })
      response.end(readFileSync(file))
    })
    server.listen(0, () => resolve(server))
  })

const shrink = (file) => execFileSync('magick', [file, '-colors', '192', `PNG8:${file}`])

execSync('bun run --filter example build', { cwd: root, stdio: 'inherit' })
mkdirSync(out, { recursive: true })

const server = await serve()
const url = `http://localhost:${server.address().port}/`
const browser = await chromium.launch()

try {
  for (const theme of ['light', 'dark']) {
    const context = await browser.newContext({ viewport, deviceScaleFactor: 2, colorScheme: theme })
    await context.addInitScript(([key, value]) => localStorage.setItem(key, value), [THEME_KEY, theme])
    const page = await context.newPage()
    await page.goto(url)
    await page.getByRole('button', { name: 'Quarterly review' }).click()
    await page.getByText('The report is ready').waitFor()
    await page.evaluate(() => document.fonts.ready)

    await page.screenshot({ path: join(out, `generator-${theme}.png`) })
    shrink(join(out, `generator-${theme}.png`))

    await page.getByText('Spec (JSON)').click()
    await page.locator('pre.code').scrollIntoViewIfNeeded()
    await page.screenshot({ path: join(out, `spec-${theme}.png`) })
    shrink(join(out, `spec-${theme}.png`))
    await context.close()
  }
} finally {
  await browser.close()
  server.close()
}
