import { readFile } from 'node:fs/promises'

import type { Download, Page } from '@playwright/test'

/** Collects page errors and console errors so a test can assert there were none. Failed requests are asserted through the UI. */
export function watchErrors(page: Page): string[] {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'error' && !message.text().startsWith('Failed to load resource')) errors.push(message.text())
  })
  return errors
}

/** The first two bytes of a downloaded file, as text. */
export async function magic(download: Download): Promise<string> {
  const path = await download.path()
  return (await readFile(path)).subarray(0, 2).toString('latin1')
}
