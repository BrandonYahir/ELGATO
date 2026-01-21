import { describe, expect, it } from 'vitest'
import { getWinner, isBoardFull, pickCpuMove, type Mark } from './gameLogic'

describe('gameLogic', () => {
  it('detects a winner on a row', () => {
    const board: Mark[] = ['X', 'X', 'X', null, null, null, null, null, null]
    expect(getWinner(board)).toBe('X')
  })

  it('detects a full board', () => {
    const board: Mark[] = ['X', 'O', 'X', 'X', 'O', 'X', 'O', 'X', 'O']
    expect(isBoardFull(board)).toBe(true)
  })

  it('cpu blocks the player', () => {
    const board: Mark[] = ['X', 'X', null, null, 'O', null, null, null, null]
    expect(pickCpuMove(board)).toBe(2)
  })

  it('cpu takes center when available', () => {
    const board: Mark[] = ['X', null, null, null, null, null, null, null, 'O']
    expect(pickCpuMove(board)).toBe(4)
  })
})
