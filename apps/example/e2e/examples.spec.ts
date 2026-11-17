import { expect, test } from '@playwright/test'

import { magic, watchErrors } from './helpers'

let errors: string[] = []

test.beforeEach(async ({ page }) => {
  errors = watchErrors(page)
  await page.goto('/examples.html')
})

test.afterEach(() => {
  expect(errors).toEqual([])
})

test('the preview example renders the report', async ({ page }) => {
  await expect(page.getByRole('heading', { level: 1, name: 'Quarterly business review' })).toBeVisible()
})

test('the download example saves a deck and a document', async ({ page }) => {
  for (const [button, ext] of [
    ['Download PPTX', '.pptx'],
    ['Download DOCX', '.docx'],
  ] as const) {
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: button }).click(),
    ])
    expect(download.suggestedFilename().endsWith(ext)).toBe(true)
    expect(await magic(download)).toBe('PK')
  }
})

test('the streaming example replays to the same content as the preview example', async ({ page }) => {
  const stream = page.getByRole('region', { name: 'Streaming report preview' })
  const replay = page.getByRole('button', { name: 'Replay' })
  await expect(replay).toBeVisible({ timeout: 15_000 })
  const first = await stream.innerHTML()

  await replay.click()
  await expect(page.getByRole('button', { name: 'Streaming…' })).toBeVisible()
  await expect(replay).toBeVisible({ timeout: 15_000 })
  expect(await stream.innerHTML()).toBe(first)
  expect(await stream.locator('.jr-report').innerHTML()).toBe(
    await page.locator('#preview-example .jr-report').innerHTML(),
  )
})
