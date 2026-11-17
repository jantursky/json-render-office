import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'

// WCAG 2.2 A and AA.
const audit = async (page: Page) => {
  const { violations } = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze()
  return violations.map(
    ({ id, help, nodes }) => `${id}: ${help} (${nodes.map((node) => node.target.join(' ')).join(', ')})`,
  )
}

for (const colorScheme of ['light', 'dark'] as const) {
  test.describe(`${colorScheme} theme`, () => {
    test.use({ colorScheme })

    test('the empty page has no accessibility violations', async ({ page }) => {
      await page.goto('/')
      expect(await audit(page)).toEqual([])
    })

    test('a report with the spec open has no accessibility violations', async ({ page }) => {
      await page.goto('/')
      await page.getByLabel('Describe the report').fill('A report for the board')
      await page.getByRole('button', { name: 'Product launch plan' }).click()
      await page.getByText('Spec (JSON)').click()
      await expect(page.getByLabel('Report spec as JSON')).toBeVisible()
      expect(await audit(page)).toEqual([])
    })

    test('the docs examples have no accessibility violations', async ({ page }) => {
      await page.goto('/examples.html')
      await expect(page.getByRole('button', { name: 'Replay' })).toBeVisible({ timeout: 15_000 })
      expect(await audit(page)).toEqual([])
    })
  })
}
