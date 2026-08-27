import { useState } from "react"
import { readStats, resetStats, winPercent } from "../lib/stats"
import "./StatsPanel.css"

const GAME_MODES = [
  { key: "classic", label: "Classic" },
  { key: "rounds", label: "Rounds" },
]
const DIFFICULTIES = [
  { key: "easy", label: "Easy" },
  { key: "hard", label: "Hard" },
]

// Stats are tracked per (game mode, difficulty) — a Rounds-Hard streak has
// nothing to do with a Classic-Easy one — so the panel is a small browser over
// the four boards rather than a single set of numbers.
function StatsPanel({ gameMode = "classic", difficulty = "hard", maxGuesses = 8, refreshToken }) {
  const [viewGameMode, setViewGameMode] = useState(gameMode)
  const [viewDifficulty, setViewDifficulty] = useState(difficulty)
  const [version, setVersion] = useState(0)

  // Read straight through on every render — it is a single localStorage hit,
  // and memoising it would only mean inventing cache keys for the two things
  // that invalidate it (`version` after a reset, `refreshToken` after a game).
  void version
  void refreshToken
  const stats = readStats(viewGameMode, viewDifficulty)

  const rounds = viewGameMode === "rounds" ? 6 : maxGuesses
  const distribution = Array.from({ length: rounds }, (_, i) => stats.distribution[i + 1] ?? 0)
  const peak = Math.max(1, ...distribution)

  return (
    <div className="stats-panel">
      <div className="stats-panel__tabs">
        <div className="stats-panel__tab-group" role="group" aria-label="Game mode">
          {GAME_MODES.map((m) => (
            <button
              key={m.key}
              type="button"
              className={`stats-panel__tab${viewGameMode === m.key ? " stats-panel__tab--active" : ""}`}
              aria-pressed={viewGameMode === m.key}
              onClick={() => setViewGameMode(m.key)}
            >
              {m.label}
            </button>
          ))}
        </div>
        <div className="stats-panel__tab-group" role="group" aria-label="Difficulty">
          {DIFFICULTIES.map((d) => (
            <button
              key={d.key}
              type="button"
              className={`stats-panel__tab${viewDifficulty === d.key ? " stats-panel__tab--active" : ""}`}
              aria-pressed={viewDifficulty === d.key}
              onClick={() => setViewDifficulty(d.key)}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>

      <div className="stats-grid">
        <div className="stats-grid__item">
          <strong>{stats.played}</strong>
          <span>Played</span>
        </div>
        <div className="stats-grid__item">
          <strong>{winPercent(stats)}</strong>
          <span>Win %</span>
        </div>
        <div className="stats-grid__item">
          <strong>{stats.currentStreak}</strong>
          <span>Streak</span>
        </div>
        <div className="stats-grid__item">
          <strong>{stats.maxStreak}</strong>
          <span>Max Streak</span>
        </div>
      </div>

      <p className="stats-panel__title">Guess Distribution</p>
      {stats.wins === 0 ? (
        <p className="modal-note">No wins on this board yet.</p>
      ) : (
        <div className="stats-panel__dist">
          {distribution.map((count, i) => (
            <div key={i} className="stats-panel__dist-row">
              <span className="stats-panel__dist-label">{i + 1}</span>
              <span
                className={`stats-panel__dist-bar${count ? "" : " stats-panel__dist-bar--empty"}`}
                style={{ width: `${(count / peak) * 100}%` }}
              >
                {count}
              </span>
            </div>
          ))}
        </div>
      )}

      <button
        type="button"
        className="stats-panel__reset"
        onClick={() => {
          resetStats(viewGameMode, viewDifficulty)
          setVersion((v) => v + 1)
        }}
      >
        Reset this board
      </button>
    </div>
  )
}

export default StatsPanel
