import { expect, test } from '@playwright/test'
import { mockCpuApi } from './mock-api'

test('shows fallback alert and allows manual dismiss', async ({ page }) => {
  await mockCpuApi(page, [
    { cpuCell: 5, geminiFallback: true, difficultyUsed: 'medium' },
  ])
  await page.goto('/')

  const difficulty = page.getByLabel('Seleccionar dificultad')
  await difficulty.selectOption('hard')

  await page.getByRole('button', { name: 'celda 1' }).click()

  const alert = page.locator('.alert-card')
  await expect(alert).toContainText('Se agotaron las peticiones disponibles de Gemini')
  await expect(difficulty).toHaveValue('medium')

  await page.getByRole('button', { name: 'Entendido' }).click()
  await expect(alert).toBeHidden()
})

test('auto-dismisses the fallback alert after 5 seconds', async ({ page }) => {
  await mockCpuApi(page, [
    { cpuCell: 5, geminiFallback: true, difficultyUsed: 'medium' },
  ])
  await page.goto('/')

  const difficulty = page.getByLabel('Seleccionar dificultad')
  await difficulty.selectOption('hard')

  await page.getByRole('button', { name: 'celda 1' }).click()

  const alert = page.locator('.alert-card')
  await expect(alert).toBeVisible()
  await expect(difficulty).toHaveValue('medium')

  await expect(alert).toBeHidden({ timeout: 6000 })
})
