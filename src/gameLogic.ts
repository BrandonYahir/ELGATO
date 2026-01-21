export type Mark = 'X' | 'O' | null

const WIN_LINES = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
]

const ORDERED_FALLBACK_MOVES = [4, 0, 2, 6, 8, 1, 3, 5, 7]

export const getWinner = (board: Mark[]): Mark => {
  for (const [a, b, c] of WIN_LINES) {
    const mark = board[a]
    if (mark && mark === board[b] && mark === board[c]) {
      return mark
    }
  }
  return null
}

export const isBoardFull = (board: Mark[]): boolean =>
  board.every((cell) => cell !== null)

const findWinningMove = (board: Mark[], mark: Exclude<Mark, null>): number | null => {
  for (const [a, b, c] of WIN_LINES) {
    const line = [board[a], board[b], board[c]]
    const markCount = line.filter((cell) => cell === mark).length
    const emptyIndex = line.findIndex((cell) => cell === null)
    if (markCount === 2 && emptyIndex !== -1) {
      return [a, b, c][emptyIndex]
    }
  }
  return null
}

export const pickCpuMove = (board: Mark[]): number | null => {
  if (isBoardFull(board)) {
    return null
  }

  const winningMove = findWinningMove(board, 'O')
  if (winningMove !== null) {
    return winningMove
  }

  const blockingMove = findWinningMove(board, 'X')
  if (blockingMove !== null) {
    return blockingMove
  }

  for (const index of ORDERED_FALLBACK_MOVES) {
    if (board[index] === null) {
      return index
    }
  }

  return null
}
