import { expect, test, type Page } from '@playwright/test'

const playCpuWinRound = async (page: Page) => {
  const cell = (index: number) => page.getByRole('button', { name: `celda ${index}` })

  await cell(2).click()
  await expect(cell(5)).toHaveText('O')

  await cell(4).click()
  await expect(cell(1)).toHaveText('O')

  await cell(6).click()
  await expect(cell(9)).toHaveText('O')
}

test('series end shows final modal after two CPU wins', async ({ page }) => {
  await page.goto('/')

  await playCpuWinRound(page)
  await expect(page.locator('.status-text')).toHaveText('La GPU gana la ronda')
  await expect(page.locator('.score-card', { hasText: 'GPU' }).locator('strong'))
    .toHaveText('1')

  await page.getByRole('button', { name: 'Siguiente ronda' }).click()
  await expect(page.locator('.score-round').locator('strong')).toHaveText('2')

  await playCpuWinRound(page)
  await expect(page.locator('.score-card', { hasText: 'GPU' }).locator('strong'))
    .toHaveText('2')

  const modal = page.getByRole('dialog', { name: 'Resultado final' })
  await expect(modal).toBeVisible()
  await expect(modal).toContainText('La GPU gana el juego')
})
