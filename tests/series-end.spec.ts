import { expect, test, type Page } from '@playwright/test'
import { mockCpuApi } from './mock-api'

const playCpuWinRound = async (page: Page) => {
  const cell = (index: number) => page.getByRole('button', { name: `celda ${index}` })

  await cell(2).click()
  await expect(cell(5)).toHaveText('O')

  await cell(4).click()
  await expect(cell(1)).toHaveText('O')

  await cell(6).click()
  await expect(cell(9)).toHaveText('O')
}

test('series end shows final modal after three CPU wins', async ({ page }) => {
  await mockCpuApi(page, [
    { cpuCell: 5 },
    { cpuCell: 1 },
    { cpuCell: 9, winner: 'O' },
    { cpuCell: 5 },
    { cpuCell: 1 },
    { cpuCell: 9, winner: 'O' },
    { cpuCell: 5 },
    { cpuCell: 1 },
    { cpuCell: 9, winner: 'O' },
  ])
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

  await page.getByRole('button', { name: 'Siguiente ronda' }).click()
  await expect(page.locator('.score-round').locator('strong')).toHaveText('3')

  await playCpuWinRound(page)
  await expect(page.locator('.score-card', { hasText: 'GPU' }).locator('strong'))
    .toHaveText('3')

  const modal = page.getByRole('dialog', { name: 'Resultado final' })
  await expect(modal).toBeVisible()
  await expect(modal).toContainText('La GPU gana el juego')
})
