import { expect, test } from '@playwright/test'

test('player move marks X, disables cell 1, and changes turn', async ({ page }) => {
  await page.goto('/')

  const status = page.locator('.status-text')
  const cell1 = page.getByRole('button', { name: 'celda 1' })

  await expect(status).toHaveText('Tu turno (X)')
  await cell1.click()

  await expect(cell1).toHaveText('X')
  await expect(cell1).toBeDisabled()
  await expect(
    page.getByRole('button', { name: /celda/i }).filter({ hasText: 'O' }),
  ).toHaveCount(1)
  await expect(status).toHaveText('Tu turno (X)')
})
