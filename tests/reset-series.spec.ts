import { expect, test } from '@playwright/test'

test('reset series clears board, scores, and round', async ({ page }) => {
  await page.goto('/')

  const status = page.locator('.status-text')
  const cell1 = page.getByRole('button', { name: 'celda 1' })

  await cell1.click()
  await expect(cell1).toHaveText('X')

  await page.getByRole('button', { name: 'Reiniciar serie' }).click()

  await expect(
    page.getByRole('button', { name: /celda/i }).filter({ hasText: /[XO]/ }),
  ).toHaveCount(0)
  await expect(status).toHaveText('Tu turno (X)')
  await expect(page.locator('.score-card', { hasText: 'Jugador' }).locator('strong'))
    .toHaveText('0')
  await expect(page.locator('.score-card', { hasText: 'GPU' }).locator('strong'))
    .toHaveText('0')
  await expect(page.locator('.score-round').locator('strong')).toHaveText('1')
})
