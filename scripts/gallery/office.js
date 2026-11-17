import { execFile } from 'node:child_process'
import { readdir } from 'node:fs/promises'
import { join } from 'node:path'
import { promisify } from 'node:util'

const run = promisify(execFile)

export const TOOLS = ['soffice', 'pdftoppm', 'magick']

/** Fails early, with the tool's name, when a program the gallery needs is not installed. */
export async function requireTools() {
  for (const tool of TOOLS) {
    try {
      await run(tool, ['--version'])
    } catch (error) {
      // pdftoppm prints its version on stderr and exits 0; a missing program has code ENOENT.
      if (error.code === 'ENOENT') throw new Error(`"${tool}" is not installed or not on the PATH.`, { cause: error })
    }
  }
}

/** The LibreOffice version that did the converting, such as "26.8.3.1". */
export async function libreOfficeVersion() {
  const { stdout } = await run('soffice', ['--version'])
  const match = /LibreOffice\s+(\S+)/.exec(stdout)
  if (!match) throw new Error(`Cannot read the LibreOffice version from "${stdout.trim()}".`)
  return match[1]
}

/** Converts files to PDF in one LibreOffice run. A throwaway profile keeps a running instance out of the way. */
export async function toPdf(files, directory) {
  await run('soffice', [
    `-env:UserInstallation=file://${join(directory, 'profile')}`,
    '--headless',
    '--convert-to',
    'pdf',
    '--outdir',
    directory,
    ...files,
  ])
}

/** Rasterizes every page of a PDF at 80 dpi and returns the PNG paths in page order. */
export async function rasterize(pdf, directory, name) {
  await run('pdftoppm', ['-r', '80', '-png', pdf, join(directory, name)])
  const pattern = new RegExp(`^${name}-(\\d+)\\.png$`)
  return (await readdir(directory))
    .filter((file) => pattern.test(file))
    .sort((a, b) => Number(pattern.exec(a)[1]) - Number(pattern.exec(b)[1]))
    .map((file) => join(directory, file))
}
