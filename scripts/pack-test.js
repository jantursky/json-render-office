// Packs the four packages and installs the tarballs into empty projects, the way a consumer
// gets them from npm: a Node ESM project that renders a deck and a document, and a Vite + Vue
// project that builds the web entry. Run after `bun run build`.
//
// Nothing is published yet and the packages depend on each other at ^1.0.0, so the tarballs
// are installed by path and npm `overrides` point the nested requirements at them as well.
import { execFileSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')
const names = ['json-render-office', 'json-render-pptx', 'json-render-docx', 'json-render-report']
const work = mkdtempSync(join(tmpdir(), 'json-render-office-pack-'))

const run = (command, args, cwd = root) => {
  try {
    return execFileSync(command, args, { cwd, encoding: 'utf8', stdio: 'pipe' })
  } catch (error) {
    throw new Error(`${command} ${args.join(' ')} failed:\n${error.stderr || error.message}`, { cause: error })
  }
}

/** Writes a file into a consumer project and returns its path. */
const write = (dir, name, content) => {
  const file = join(dir, name)
  writeFileSync(file, content)
  return file
}

const allowed = /^(dist\/.+\.(js|js\.map|d\.ts)|skills\/.+|README\.md|CHANGELOG\.md|LICENSE|package\.json)$/

function pack() {
  const tarballs = join(work, 'tarballs')
  mkdirSync(tarballs)
  const paths = {}
  for (const name of names) {
    const [packed] = JSON.parse(
      run('npm', ['pack', '--json', '--pack-destination', tarballs], join(root, 'packages', name)),
    )
    const unexpected = packed.files.map((file) => file.path).filter((file) => !allowed.test(file))
    if (unexpected.length > 0) throw new Error(`Unexpected files in ${packed.filename}: ${unexpected.join(', ')}`)
    paths[name] = `file:${join(tarballs, packed.filename)}`
    console.log(`tarball: ${packed.filename}, ${packed.files.length} files, ${(packed.size / 1024).toFixed(1)} kB`)
  }
  return paths
}

function consumer(name, dependencies, tarballs, devDependencies = {}) {
  const dir = join(work, name)
  mkdirSync(dir)
  write(
    dir,
    'package.json',
    JSON.stringify({
      name,
      private: true,
      type: 'module',
      dependencies: { ...tarballs, ...dependencies },
      devDependencies,
      // The packages require each other at ^1.0.0; this resolves those to the tarballs.
      overrides: Object.fromEntries(names.map((pkg) => [pkg, `$${pkg}`])),
    }),
  )
  run('npm', ['install', '--prefix', dir, '--no-audit', '--no-fund', '--loglevel=error'])
  return dir
}

const peers = { '@json-render/core': '^0.23.1', vue: '^3.5.0', zod: '^4.0.0' }

const nodeConsumer = `import { strFromU8, unzipSync } from 'fflate'
import { renderToDocx, renderToPptx } from 'json-render-report'

const spec = {
  root: 'report',
  elements: {
    report: { type: 'Report', props: { title: 'Pack test report', subtitle: null, author: null }, children: ['c'] },
    c: { type: 'Chapter', props: { title: 'First chapter', notes: null }, children: ['p'] },
    p: { type: 'Paragraph', props: { text: 'Hello from the tarball' }, children: [] },
  },
}

const check = (bytes, kind, part, text) => {
  if (bytes[0] !== 0x50 || bytes[1] !== 0x4b || bytes[2] !== 3 || bytes[3] !== 4) throw new Error(kind + ' is not a ZIP')
  const files = unzipSync(bytes)
  const xml = Object.keys(files)
    .filter((name) => part.test(name))
    .map((name) => strFromU8(files[name]))
    .join('')
  if (!xml.includes(text)) throw new Error(kind + ' has no "' + text + '"')
  console.log(kind + ': ' + bytes.length + ' bytes, contains "' + text + '"')
}

check(await renderToPptx(spec), 'pptx', /^ppt\\/slides\\/slide\\d+\\.xml$/, 'Pack test report')
check(await renderToDocx(spec), 'docx', /^word\\/document\\.xml$/, 'Hello from the tarball')
`

// The server entries stay usable in code that only builds prompts: no Vue, no document engine.
const serverConsumer = `import { register } from 'node:module'

register('./block.mjs', import.meta.url)
const entries = ['json-render-pptx/server', 'json-render-docx/server', 'json-render-report/server']
for (const entry of entries) {
  const { schema, standardComponentDefinitions } = await import(entry)
  if (!schema || Object.keys(standardComponentDefinitions).length === 0) throw new Error(entry + ' is empty')
  console.log(entry + ': loads without vue or an engine')
}
`

const blockHook = `const blocked = ['vue', '@vue', 'vue-pptx-document', 'vue-docx-document', 'pptxgenjs', 'docx', 'jszip']

export async function resolve(specifier, context, next) {
  if (blocked.some((name) => specifier === name || specifier.startsWith(name + '/'))) {
    throw new Error('A server entry imported ' + specifier)
  }
  return next(specifier, context)
}
`

function nodeProject(tarballs) {
  const dir = consumer('node-esm', { ...peers, fflate: '^0.8' }, tarballs)
  console.log(run('node', [write(dir, 'consumer.mjs', nodeConsumer)]).trim())
  write(dir, 'block.mjs', blockHook)
  console.log(run('node', [write(dir, 'server.mjs', serverConsumer)]).trim())
}

function viteProject(tarballs) {
  const dir = consumer('vite-vue', peers, tarballs, { vite: '^8', '@vitejs/plugin-vue': '^6' })
  write(dir, 'index.html', '<div id="app"></div><script type="module" src="/main.js"></script>')
  write(
    dir,
    'vite.config.js',
    "import vue from '@vitejs/plugin-vue'\nimport { defineConfig } from 'vite'\n\nexport default defineConfig({ plugins: [vue()] })\n",
  )
  write(
    dir,
    'main.js',
    `import { createApp, h } from 'vue'
import { themeStyle, webRegistry, webStyles } from 'json-render-report/web'

const style = document.createElement('style')
style.textContent = webStyles
document.head.append(style)
createApp({ render: () => h('div', { style: themeStyle() }, Object.keys(webRegistry).join(' ')) }).mount('#app')
`,
  )
  run('node', [join(dir, 'node_modules/vite/bin/vite.js'), 'build', dir])
  const assets = join(dir, 'dist/assets')
  const bundle = readdirSync(assets)
    .filter((file) => file.endsWith('.js'))
    .map((file) => readFileSync(join(assets, file), 'utf8'))
    .join('')
  if (!bundle.includes('jr-report')) throw new Error('The web entry is missing from the Vite bundle')
  if (bundle.includes('ppt/slides') || bundle.includes('word/document')) {
    throw new Error('The web entry pulled a document engine into the browser bundle')
  }
  console.log(`vite build: ${(bundle.length / 1024).toFixed(1)} kB of JavaScript, no document engine`)
}

try {
  const tarballs = pack()
  nodeProject(tarballs)
  viteProject(tarballs)
} catch (error) {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
} finally {
  rmSync(work, { recursive: true, force: true })
}
