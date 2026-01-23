import { useEffect, useMemo, useState } from 'react'
import { getWinner, isBoardFull, pickCpuMove, type Mark } from './gameLogic'
import AppView from './AppView'

type Turn = 'player' | 'cpu'
type RoundResult = 'player' | 'cpu' | 'draw' | null
type HistoryEntry = { round: number; result: Exclude<RoundResult, null> }
type PersistedState = {
  board: Mark[]
  turn: Turn
  round: number
  scores: { player: number; cpu: number }
  roundResult: RoundResult
  totalWinner: 'player' | 'cpu' | null
  history: HistoryEntry[]
}

const createEmptyBoard = (): Mark[] => Array(9).fill(null)
const MAX_WINS = 3
const STORAGE_KEY = 'gato-series-v2'

const formatResult = (result: RoundResult): string => {
  if (result === 'player') return 'Ganaste la ronda'
  if (result === 'cpu') return 'La GPU gana la ronda'
  if (result === 'draw') return 'Empate en la ronda'
  return ''
}

const formatTotalWinner = (winner: 'player' | 'cpu' | null): string => {
  if (winner === 'player') return 'Victoria total del jugador'
  if (winner === 'cpu') return 'Victoria total de la GPU'
  return 'Serie empatada, sin ganador'
}

const formatHistoryResult = (result: Exclude<RoundResult, null>): string => {
  if (result === 'player') return 'Victoria'
  if (result === 'cpu') return 'Derrota'
  return 'Empate'
}

const loadPersistedState = (): PersistedState | null => {
  if (typeof window === 'undefined') return null
  const raw = window.localStorage.getItem(STORAGE_KEY)
  if (!raw) return null

  try {
    const parsed = JSON.parse(raw) as Partial<PersistedState>
    const board = Array.isArray(parsed.board) ? parsed.board : null
    const validBoard =
      board &&
      board.length === 9 &&
      board.every((cell) => cell === 'X' || cell === 'O' || cell === null)
        ? board
        : null

    const scores = parsed.scores
    const validScores =
      scores &&
      typeof scores.player === 'number' &&
      typeof scores.cpu === 'number'
        ? scores
        : null

    const round = typeof parsed.round === 'number' ? parsed.round : null
    const turn = parsed.turn === 'player' || parsed.turn === 'cpu' ? parsed.turn : null
    const roundResult =
      parsed.roundResult === 'player' ||
      parsed.roundResult === 'cpu' ||
      parsed.roundResult === 'draw' ||
      parsed.roundResult === null
        ? parsed.roundResult
        : null
    const totalWinner =
      parsed.totalWinner === 'player' || parsed.totalWinner === 'cpu'
        ? parsed.totalWinner
        : parsed.totalWinner === null
          ? null
          : null

    const history = Array.isArray(parsed.history) ? parsed.history : []
    const validHistory = history.filter((entry) => {
      if (!entry || typeof entry !== 'object') return false
      if (typeof entry.round !== 'number') return false
      return entry.result === 'player' || entry.result === 'cpu' || entry.result === 'draw'
    }) as HistoryEntry[]

    if (!validBoard || !validScores || !round || !turn) return null

    return {
      board: validBoard,
      turn,
      round,
      scores: validScores,
      roundResult,
      totalWinner,
      history: validHistory,
    }
  } catch {
    return null
  }
}

const App = () => {
  const initialState = useMemo(
    () =>
      loadPersistedState() ?? {
        board: createEmptyBoard(),
        turn: 'player' as Turn,
        round: 1,
        scores: { player: 0, cpu: 0 },
        roundResult: null,
        totalWinner: null,
        history: [],
      },
    [],
  )

  const [board, setBoard] = useState<Mark[]>(() => initialState.board)
  const [turn, setTurn] = useState<Turn>(() => initialState.turn)
  const [round, setRound] = useState(() => initialState.round)
  const [scores, setScores] = useState(() => initialState.scores)
  const [roundResult, setRoundResult] = useState<RoundResult>(
    () => initialState.roundResult,
  )
  const [totalWinner, setTotalWinner] = useState<'player' | 'cpu' | null>(
    () => initialState.totalWinner,
  )
  const [history, setHistory] = useState<HistoryEntry[]>(() => initialState.history)

  const seriesOver = useMemo(
    () => totalWinner !== null || (roundResult !== null && round >= 5),
    [round, roundResult, totalWinner],
  )

  const statusMessage = useMemo(() => {
    if (totalWinner) return formatTotalWinner(totalWinner)
    if (seriesOver && roundResult) return formatTotalWinner(null)
    if (roundResult) return formatResult(roundResult)
    return turn === 'player' ? 'Tu turno (X)' : 'Turno de la GPU (O)'
  }, [roundResult, seriesOver, totalWinner, turn])

  const finalOutcome = useMemo(() => {
    if (!seriesOver) return null
    if (totalWinner === 'player') {
      return { text: 'Ganaste el juego', symbol: ':)', tone: 'win' as const }
    }
    if (totalWinner === 'cpu') {
      return { text: 'La GPU gana el juego', symbol: ':(', tone: 'loss' as const }
    }
    return { text: 'Empate total', symbol: '?', tone: 'draw' as const }
  }, [seriesOver, totalWinner])

  const historyItems = useMemo(
    () =>
      history.map((entry, index) => ({
        key: `${entry.round}-${index}`,
        round: entry.round,
        result: entry.result,
        resultLabel: formatHistoryResult(entry.result),
      })),
    [history],
  )

  const finishRound = (winner: 'player' | 'cpu' | 'draw') => {
    setRoundResult(winner)
    setHistory((prev) => [...prev, { round, result: winner }])
    if (winner === 'draw') return

    setScores((prev) => {
      const next = { ...prev, [winner]: prev[winner] + 1 }
      if (next[winner] >= MAX_WINS) {
        setTotalWinner(winner)
      }
      return next
    })
  }

  const handleCellClick = (index: number) => {
    if (turn !== 'player' || roundResult || seriesOver) return
    if (board[index] !== null) return

    const nextBoard = [...board]
    nextBoard[index] = 'X'
    setBoard(nextBoard)

    const winner = getWinner(nextBoard)
    if (winner === 'X') {
      finishRound('player')
      return
    }

    if (isBoardFull(nextBoard)) {
      finishRound('draw')
      return
    }

    setTurn('cpu')
  }

  useEffect(() => {
    if (turn !== 'cpu' || roundResult || seriesOver) return

    const move = pickCpuMove(board)
    if (move === null) {
      finishRound('draw')
      setTurn('player')
      return
    }

    const nextBoard = [...board]
    nextBoard[move] = 'O'
    setBoard(nextBoard)

    const winner = getWinner(nextBoard)
    if (winner === 'O') {
      finishRound('cpu')
      setTurn('player')
      return
    }

    if (isBoardFull(nextBoard)) {
      finishRound('draw')
      setTurn('player')
      return
    }

    setTurn('player')
  }, [board, roundResult, seriesOver, turn])

  const handleNextRound = () => {
    if (!roundResult || seriesOver) return
    setRound((prev) => Math.min(prev + 1, 5))
    setBoard(createEmptyBoard())
    setRoundResult(null)
    setTurn('player')
  }

  const handleResetSeries = () => {
    setBoard(createEmptyBoard())
    setTurn('player')
    setRound(1)
    setScores({ player: 0, cpu: 0 })
    setRoundResult(null)
    setTotalWinner(null)
    setHistory([])
  }

  useEffect(() => {
    if (typeof window === 'undefined') return
    const snapshot: PersistedState = {
      board,
      turn,
      round,
      scores,
      roundResult,
      totalWinner,
      history,
    }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot))
  }, [board, turn, round, scores, roundResult, totalWinner, history])

  return (
    <AppView
      maxWins={MAX_WINS}
      scores={scores}
      round={round}
      board={board}
      turn={turn}
      roundResult={roundResult}
      seriesOver={seriesOver}
      statusMessage={statusMessage}
      historyItems={historyItems}
      finalOutcome={finalOutcome}
      onCellClick={handleCellClick}
      onNextRound={handleNextRound}
      onResetSeries={handleResetSeries}
    />
  )
}

export default App
