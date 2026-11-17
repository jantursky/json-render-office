import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { writeFile } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'

import { chromium } from 'playwright'

import { webRegistry, webStyles, themeStyle } from '../../packages/json-render-report/dist/web.js'
import { compose } from './images.js'

// `@json-render/vue` and `vue` are peers of the report package, so they resolve from there.
const fromReport = createRequire(new URL('../../packages/json-render-report/package.json', import.meta.url))
const load = (name) => import(pathToFileURL(fromReport.resolve(name)).href)

/** Draws the report web page: server-rendered with the web registry, then screenshotted in Chromium. */
export async function screenshotWeb(spec, target) {
  const [{ createSSRApp, h }, { renderToString }, { JSONUIProvider, Renderer }] = await Promise.all([
    load('vue'),
    load('vue/server-renderer'),
    load('@json-render/vue'),
  ])
  const app = createSSRApp({
    render: () =>
      h(JSONUIProvider, { registry: webRegistry }, { default: () => h(Renderer, { spec, registry: webRegistry }) }),
  })
  const style = Object.entries(themeStyle())
    .map(([name, value]) => `${name}:${value}`)
    .join(';')
  const page = `<!doctype html><meta charset="utf-8"><style>body{margin:0;background:#fff}${webStyles}</style><div style="${style}">${await renderToString(app)}</div>`

  const file = join(tmpdir(), `json-render-web-${process.pid}.html`)
  await writeFile(file, page)
  const browser = await chromium.launch()
  try {
    const tab = await browser.newPage({ viewport: { width: 760, height: 600 } })
    await tab.goto(pathToFileURL(file).href)
    const png = join(tmpdir(), `json-render-web-${process.pid}.png`)
    await tab.screenshot({ path: png, fullPage: true })
    return await compose([png], undefined, target)
  } finally {
    await browser.close()
  }
}
