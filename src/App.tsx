import { useEffect, useMemo, useState } from 'react'
import { getWinner, isBoardFull, pickCpuMove, type Mark } from './gameLogic'

type Turn = 'player' | 'cpu'
type RoundResult = 'player' | 'cpu' | 'draw' | null

const createEmptyBoard = (): Mark[] => Array(9).fill(null)
const MAX_WINS = 2

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

const App = () => {
  const [board, setBoard] = useState<Mark[]>(() => createEmptyBoard())
  const [turn, setTurn] = useState<Turn>('player')
  const [round, setRound] = useState(1)
  const [scores, setScores] = useState({ player: 0, cpu: 0 })
  const [roundResult, setRoundResult] = useState<RoundResult>(null)
  const [totalWinner, setTotalWinner] = useState<'player' | 'cpu' | null>(null)

  const seriesOver = useMemo(
    () => totalWinner !== null || (roundResult !== null && round >= 3),
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

  const finishRound = (winner: 'player' | 'cpu' | 'draw') => {
    setRoundResult(winner)
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
    setRound((prev) => Math.min(prev + 1, 3))
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
  }

  return (
    <div className="page">
      <header className="header">
        <div className="title-block">
          <p className="eyebrow">Mejor de 3</p>
          <h1>Juego del Gato</h1>
          <p className="sub">
            Usuario vs GPU. Primero a {MAX_WINS} victorias gana la serie.
          </p>
        </div>
        <div className="scoreboard">
          <div className="score-card">
            <span className="label">Jugador</span>
            <strong>{scores.player}</strong>
          </div>
          <div className="score-card">
            <span className="label">GPU</span>
            <strong>{scores.cpu}</strong>
          </div>
          <div className="score-card score-round">
            <span className="label">Ronda</span>
            <strong>{round}</strong>
          </div>
        </div>
      </header>

      <section className="arena">
        <div className="board" role="grid" aria-label="Tablero del gato">
          {board.map((cell, index) => (
            <button
              key={index}
              className={`cell ${cell ? 'filled' : ''}`}
              aria-label={`celda ${index + 1}`}
              disabled={
                cell !== null || turn !== 'player' || roundResult !== null || seriesOver
              }
              onClick={() => handleCellClick(index)}
              type="button"
            >
              {cell}
            </button>
          ))}
        </div>

        <aside className="panel">
          <div className="status-card">
            <span className="label">Estado</span>
            <p className="status-text">{statusMessage}</p>
          </div>

          <div className="actions">
            {!seriesOver && roundResult && (
              <button className="primary" onClick={handleNextRound} type="button">
                Siguiente ronda
              </button>
            )}
            <button className="ghost" onClick={handleResetSeries} type="button">
              Reiniciar serie
            </button>
          </div>

          <div className="legend">
            <div>
              <span className="mark player">X</span>
              <span>Jugador</span>
            </div>
            <div>
              <span className="mark cpu">O</span>
              <span>GPU</span>
            </div>
          </div>
        </aside>
      </section>

      {finalOutcome && (
        <div className="modal-overlay" role="presentation">
          <div
            className={`modal-card ${finalOutcome.tone}`}
            role="dialog"
            aria-live="polite"
            aria-label="Resultado final"
          >
            <div className="modal-symbol">{finalOutcome.symbol}</div>
            <h2>{finalOutcome.text}</h2>
            <p className="modal-subtitle">Gracias por jugar.</p>
            <button className="primary" onClick={handleResetSeries} type="button">
              Reiniciar serie
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
