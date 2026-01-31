import { useEffect, useMemo, useState } from 'react'
import AppView from './AppView'
import type { Difficulty, Mark } from './types'

type Turn = 'player' | 'cpu'
type RoundResult = 'player' | 'cpu' | 'draw' | null
type HistoryEntry = { round: number; result: Exclude<RoundResult, null> }
type Theme = 'light' | 'dark'

const createEmptyBoard = (): Mark[] => Array(9).fill(null)
const MAX_WINS = 3
const THEME_STORAGE_KEY = 'theme'

type ApiMoveResponse = {
  board?: Mark[]
  move?: number | null
  winner?: Mark
  draw?: boolean
  difficultyUsed?: Difficulty
  geminiFallback?: boolean
}

type PlayerMoveHistory = number[][]

const getApiBase = (): string => {
  const envBase = import.meta.env.VITE_API_URL
  if (typeof envBase === 'string' && envBase.trim().length > 0) {
    return envBase.replace(/\/$/, '')
  }
  return '/api'
}

const apiFetch = async <T,>(path: string, options?: RequestInit): Promise<T> => {
  const response = await fetch(`${getApiBase()}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers ?? {}),
    },
    ...options,
  })

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`)
  }

  return (await response.json()) as T
}

const isValidBoard = (value: unknown): value is Mark[] =>
  Array.isArray(value) &&
  value.length === 9 &&
  value.every((cell) => cell === 'X' || cell === 'O' || cell === null)

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

const getInitialTheme = (): Theme => {
  if (typeof window === 'undefined') return 'light'
  const stored = window.localStorage.getItem(THEME_STORAGE_KEY)
  if (stored === 'light' || stored === 'dark') return stored
  if (window.matchMedia?.('(prefers-color-scheme: dark)').matches) return 'dark'
  return 'light'
}

const App = () => {
  const [board, setBoard] = useState<Mark[]>(() => createEmptyBoard())
  const [turn, setTurn] = useState<Turn>('player')
  const [round, setRound] = useState(1)
  const [scores, setScores] = useState({ player: 0, cpu: 0 })
  const [roundResult, setRoundResult] = useState<RoundResult>(null)
  const [totalWinner, setTotalWinner] = useState<'player' | 'cpu' | null>(null)
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [isRequestPending, setIsRequestPending] = useState(false)
  const [difficulty, setDifficulty] = useState<Difficulty>('medium')
  const [currentPlayerMoves, setCurrentPlayerMoves] = useState<number[]>([])
  const [playerMoveHistory, setPlayerMoveHistory] = useState<PlayerMoveHistory>([])
  const [notice, setNotice] = useState<string | null>(null)
  const [theme, setTheme] = useState<Theme>(() => getInitialTheme())

  useEffect(() => {
    if (!notice) return
    const timer = window.setTimeout(() => {
      setNotice(null)
    }, 5000)
    return () => window.clearTimeout(timer)
  }, [notice])

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    window.localStorage.setItem(THEME_STORAGE_KEY, theme)
  }, [theme])

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
    setPlayerMoveHistory((prev) => {
      if (currentPlayerMoves.length === 0) return prev
      const next = [...prev, currentPlayerMoves]
      return next.slice(-5)
    })
    setCurrentPlayerMoves([])
    if (winner === 'draw') return

    setScores((prev) => {
      const next = { ...prev, [winner]: prev[winner] + 1 }
      if (next[winner] >= MAX_WINS) {
        setTotalWinner(winner)
      }
      return next
    })
  }

  const handleCellClick = async (index: number) => {
    if (turn !== 'player' || roundResult || seriesOver || isRequestPending) return
    if (board[index] !== null) return

    const previousBoard = board
    const nextBoard = [...board]
    nextBoard[index] = 'X'
    setBoard(nextBoard)
    setCurrentPlayerMoves((prev) => [...prev, index])
    setTurn('cpu')
    setIsRequestPending(true)

    try {
      const data = await apiFetch<ApiMoveResponse>('/cpu-move', {
        method: 'POST',
        body: JSON.stringify({
          board: nextBoard,
          difficulty,
          history: playerMoveHistory,
        }),
      })

      const resolvedBoard = isValidBoard(data.board) ? data.board : nextBoard
      setBoard(resolvedBoard)

      if (data.winner === 'X') {
        finishRound('player')
      } else if (data.winner === 'O') {
        finishRound('cpu')
      } else if (data.draw) {
        finishRound('draw')
      }

      if (data.geminiFallback) {
        setNotice(
          'Se agotaron las peticiones disponibles de Gemini. La dificultad cambiara a Media.',
        )
        setDifficulty('medium')
      }

      setTurn('player')
    } catch {
      setBoard(previousBoard)
      setTurn('player')
    } finally {
      setIsRequestPending(false)
    }
  }

  const handleNextRound = () => {
    if (!roundResult || seriesOver || isRequestPending) return
    setRound((prev) => Math.min(prev + 1, 5))
    setBoard(createEmptyBoard())
    setRoundResult(null)
    setCurrentPlayerMoves([])
    setTurn('player')
  }

  const handleResetSeries = () => {
    if (isRequestPending) return
    setBoard(createEmptyBoard())
    setTurn('player')
    setRound(1)
    setScores({ player: 0, cpu: 0 })
    setRoundResult(null)
    setTotalWinner(null)
    setHistory([])
    setCurrentPlayerMoves([])
    setPlayerMoveHistory([])
    setNotice(null)
  }

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
      notice={notice}
      onDismissNotice={() => setNotice(null)}
      historyItems={historyItems}
      finalOutcome={finalOutcome}
      difficulty={difficulty}
      onDifficultyChange={setDifficulty}
      theme={theme}
      onToggleTheme={() =>
        setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))
      }
      onCellClick={handleCellClick}
      onNextRound={handleNextRound}
      onResetSeries={handleResetSeries}
    />
  )
}

export default App
