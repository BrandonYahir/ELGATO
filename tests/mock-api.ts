import type { Page } from '@playwright/test'
import type { Mark } from '../src/types'

type CpuStep = {
  cpuCell?: number
  winner?: Mark
  draw?: boolean
}

const toBoard = (value: unknown): Mark[] => {
  if (Array.isArray(value) && value.length === 9) {
    return value.map((cell) => (cell === 'X' || cell === 'O' || cell === null ? cell : null))
  }
  return Array(9).fill(null)
}

export const mockCpuApi = async (page: Page, steps: CpuStep[]) => {
  let callIndex = 0

  await page.route(/.*\/(api\/)?cpu-move$/, async (route, request) => {
    const step = steps[Math.min(callIndex, steps.length - 1)] ?? {}
    callIndex += 1

    let requestBody: unknown = null
    try {
      requestBody = request.postDataJSON()
    } catch {
      requestBody = null
    }

    const board = toBoard((requestBody as { board?: unknown } | null)?.board)

    if (typeof step.cpuCell === 'number') {
      const index = step.cpuCell - 1
      if (index >= 0 && index < board.length && board[index] === null) {
        board[index] = 'O'
      }
    }

    const response = {
      board,
      ...(typeof step.cpuCell === 'number' ? { move: step.cpuCell - 1 } : {}),
      ...(step.winner ? { winner: step.winner } : {}),
      ...(step.draw ? { draw: true } : {}),
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(response),
    })
  })
}
