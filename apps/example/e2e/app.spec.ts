import { expect, test, type Page } from '@playwright/test'

import { magic, watchErrors } from './helpers'
import { quarterly } from '../src/examples'
import { specToPatches } from '../src/lib/patches'

let errors: string[] = []

test.beforeEach(async ({ page }) => {
  errors = watchErrors(page)
  await page.goto('/')
})

test.afterEach(() => {
  expect(errors).toEqual([])
})

const preview = (page: Page) => page.getByRole('region', { name: /Report preview/ })

test('renders every fixed example without issues', async ({ page }) => {
  const titles = {
    'Quarterly review': 'Quarterly business review',
    'Product launch plan': 'Product launch plan',
    'Project status': 'Project status',
  }
  for (const [chip, title] of Object.entries(titles)) {
    await page.getByRole('button', { name: chip }).click()
    await expect(preview(page).getByRole('heading', { level: 1 })).toHaveText(title)
    await expect(page.getByText('The report is ready')).toBeVisible()
    await expect(page.getByRole('heading', { name: /issues?$/ })).toHaveCount(0)
  }
})

test('downloads the report as a deck and as a document', async ({ page }) => {
  await page.getByRole('button', { name: 'Quarterly review' }).click()
  for (const [button, name] of [
    ['Download PPTX', 'quarterly-business-review.pptx'],
    ['Download DOCX', 'quarterly-business-review.docx'],
  ] as const) {
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: button }).click(),
    ])
    expect(download.suggestedFilename()).toBe(name)
    expect(await magic(download)).toBe('PK')
  }
})

test('downloads stay disabled until there is a report', async ({ page }) => {
  await expect(page.getByRole('button', { name: 'Download PPTX' })).toBeDisabled()
  await expect(page.getByRole('button', { name: 'Generate report' })).toBeDisabled()
})

test('shows the spec and copies it', async ({ page, context, browserName }) => {
  await page.getByRole('button', { name: 'Project status' }).click()
  await page.getByText('Spec (JSON)').click()
  await expect(page.getByLabel('Report spec as JSON')).toContainText('"type": "Report"')
  if (browserName === 'chromium') {
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])
    await page.getByRole('button', { name: 'Copy JSON' }).click()
    await expect(page.getByRole('button', { name: 'Copied' })).toBeVisible()
  }
})

test('streams a generated report into the same content as the fixed example', async ({ page }) => {
  await page.route('**/api/generate', (route) =>
    route.fulfill({ status: 200, contentType: 'text/plain; charset=utf-8', body: specToPatches(quarterly).join('') }),
  )
  await page.getByLabel('Describe the report').fill('A quarterly business review')
  await page.getByRole('button', { name: 'Generate report' }).click()
  await expect(page.getByText('The report is ready')).toBeVisible()
  const streamed = await preview(page).innerHTML()

  await page.getByRole('button', { name: 'Quarterly review' }).click()
  await expect(page.getByText('The report is ready')).toBeVisible()
  expect(await preview(page).innerHTML()).toBe(streamed)
})

test('reports a missing model and keeps the examples available', async ({ page }) => {
  await page.route('**/api/generate', (route) => route.fulfill({ status: 501, json: { error: 'no-model' } }))
  await page.getByLabel('Describe the report').fill('Anything')
  await page.getByRole('button', { name: 'Generate report' }).click()
  await expect(page.getByRole('alert')).toContainText('no model configured')
  await page.getByRole('button', { name: 'Project status' }).click()
  await expect(preview(page).getByRole('heading', { level: 1 })).toHaveText('Project status')
  await expect(page.getByRole('alert')).toHaveCount(0)
})

test('reports a failed request', async ({ page }) => {
  await page.route('**/api/generate', (route) => route.abort())
  await page.getByLabel('Describe the report').fill('Anything')
  await page.getByRole('button', { name: 'Generate report' }).click()
  await expect(page.getByRole('alert')).toContainText('could not be generated')
})

test('remembers the chosen theme', async ({ page }) => {
  await page.getByRole('button', { name: /theme$/ }).click()
  const theme = await page.locator('html').getAttribute('data-theme')
  expect(['light', 'dark']).toContain(theme)
  await page.reload()
  await expect(page.locator('html')).toHaveAttribute('data-theme', theme ?? '')
})

test('fits a 375px screen', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 })
  await page.getByRole('button', { name: 'Quarterly review' }).click()
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  )
  expect(overflow).toBeLessThanOrEqual(0)
})
