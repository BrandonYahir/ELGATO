import { expect, test } from '@playwright/test'

test('round end flow shows next round and resets board', async ({ page }) => {
  await page.goto('/')

  const status = page.locator('.status-text')
  const cell1 = page.getByRole('button', { name: 'celda 1' })
  const cell3 = page.getByRole('button', { name: 'celda 3' })
  const cell4 = page.getByRole('button', { name: 'celda 4' })
  const cell5 = page.getByRole('button', { name: 'celda 5' })
  const cell7 = page.getByRole('button', { name: 'celda 7' })
  const cell8 = page.getByRole('button', { name: 'celda 8' })
  const cell9 = page.getByRole('button', { name: 'celda 9' })

  await expect(status).toHaveText('Tu turno (X)')

  await cell1.click()
  await expect(cell5).toHaveText('O')

  await cell9.click()
  await expect(cell3).toHaveText('O')

  await cell7.click()
  await expect(cell8).toHaveText('O')

  await cell4.click()
  await expect(status).toHaveText('Ganaste la ronda')

  const nextRound = page.getByRole('button', { name: 'Siguiente ronda' })
  await expect(nextRound).toBeVisible()
  await nextRound.click()

  await expect(
    page.getByRole('button', { name: /celda/i }).filter({ hasText: /[XO]/ }),
  ).toHaveCount(0)
  await expect(page.locator('.score-round').locator('strong')).toHaveText('2')
  await expect(status).toHaveText('Tu turno (X)')
})
