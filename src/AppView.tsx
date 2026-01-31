import type { Difficulty, Mark } from './types'

type HistoryItem = {
  key: string
  round: number
  result: 'player' | 'cpu' | 'draw'
  resultLabel: string
}

type FinalOutcome = { text: string; symbol: string; tone: 'win' | 'loss' | 'draw' } | null

type AppViewProps = {
  maxWins: number
  scores: { player: number; cpu: number }
  round: number
  board: Mark[]
  turn: 'player' | 'cpu'
  roundResult: 'player' | 'cpu' | 'draw' | null
  seriesOver: boolean
  statusMessage: string
  notice: string | null
  onDismissNotice: () => void
  historyItems: HistoryItem[]
  finalOutcome: FinalOutcome
  difficulty: Difficulty
  onDifficultyChange: (value: Difficulty) => void
  theme: 'light' | 'dark'
  onToggleTheme: () => void
  onCellClick: (index: number) => void
  onNextRound: () => void
  onResetSeries: () => void
}

const AppView = ({
  maxWins,
  scores,
  round,
  board,
  turn,
  roundResult,
  seriesOver,
  statusMessage,
  notice,
  onDismissNotice,
  historyItems,
  finalOutcome,
  difficulty,
  onDifficultyChange,
  theme,
  onToggleTheme,
  onCellClick,
  onNextRound,
  onResetSeries,
}: AppViewProps) => {
  return (
    <div className="page">
      <header className="header">
        <div className="title-block">
          <p className="eyebrow">Juego del Gato</p>
          <h1>Mejor de 5</h1>
          <p className="sub">
            Usuario vs GPU. Primero a {maxWins} victorias gana la serie.
          </p>
        </div>
        <div className="header-actions">
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
          <label className="theme-toggle">
            <span>Modo oscuro</span>
            <span className="toggle">
              <input
                type="checkbox"
                checked={theme === 'dark'}
                onChange={onToggleTheme}
                aria-label="Alternar modo oscuro"
              />
              <span className="toggle-track" aria-hidden="true">
                <span className="toggle-thumb" />
              </span>
            </span>
          </label>
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
              onClick={() => onCellClick(index)}
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

          {notice && (
            <div className="alert-card" role="status" aria-live="polite">
              <span className="label">Aviso</span>
              <p>{notice}</p>
              <button className="alert-dismiss" onClick={onDismissNotice} type="button">
                Entendido
              </button>
            </div>
          )}

          <div className="difficulty-card">
            <span className="label">Dificultad CPU</span>
            <div className="difficulty-control">
              <select
                aria-label="Seleccionar dificultad"
                value={difficulty}
                onChange={(event) => onDifficultyChange(event.target.value as Difficulty)}
              >
                <option value="easy">Fácil</option>
                <option value="medium">Media</option>
                <option value="hard">Difícil (Gemini)</option>
              </select>
            </div>
          </div>

          <div className="actions">
            {!seriesOver && roundResult && (
              <button className="primary" onClick={onNextRound} type="button">
                Siguiente ronda
              </button>
            )}
            <button className="ghost" onClick={onResetSeries} type="button">
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

          <div className="history-card">
            <span className="label">Historial</span>
            {historyItems.length === 0 ? (
              <p className="history-empty">Sin resultados todavÃ­a.</p>
            ) : (
              <ul className="history-list">
                {historyItems.map((entry) => (
                  <li
                    key={entry.key}
                    className={`history-item ${entry.result}`}
                  >
                    <span className="history-round">Ronda {entry.round}</span>
                    <span className="history-result">{entry.resultLabel}</span>
                  </li>
                ))}
              </ul>
            )}
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
            <button className="primary" onClick={onResetSeries} type="button">
              Reiniciar serie
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default AppView
