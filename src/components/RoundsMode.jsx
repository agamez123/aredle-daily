import { useEffect, useMemo, useState } from "react"
import { MODE_POOLS, ROUNDS_MAX_GUESSES as MAX_ROUNDS } from "../data/modes"
import { dailyAnswer } from "../utils/daily"
import { useDailyProgress } from "../hooks/useDailyProgress"
import WinModal from "./WinModal"
import "./RoundsMode.css"

// Each row unlocks at a given stage (1-5); stage 6 unlocks nothing new, so
// the final round is a last guess with every clue already on the table.
// Description+Position, then Creator+Verifier, unlock in pairs so all 8
// data points still clear by round 5. `mono` flags the columns that read as
// ledger figures (tabular monospace) rather than prose, matching the Score
// Sheet treatment used in Classic mode.
const HINT_ROWS = [
  { key: "tags", label: "Tags", stage: 1, value: (l) => (l.tags.length ? l.tags.join(", ") : "None on record") },
  { key: "version", label: "Version", stage: 1, value: (l) => l.version, mono: true },
  { key: "description", label: "Description", stage: 2, value: (l) => l.description || "No description on record." },
  { key: "position", label: "Position", stage: 2, value: (l) => `#${l.position}`, mono: true },
  { key: "creator", label: "Creator", stage: 3, value: (l) => l.creator },
  { key: "verifier", label: "Verifier", stage: 3, value: (l) => l.verifier },
  { key: "song", label: "Song", stage: 4, value: (l) => l.song || "Unknown" },
  { key: "thumbnail", label: "Thumbnail", stage: 5, value: (l) => `/thumbnails/${l.level_id}.webp` },
]

function RoundsMode({ mode, onChangeMode }) {
  const levelPool = MODE_POOLS[mode] ?? MODE_POOLS.hard

  const comboKey = `rounds-${mode}`
  const [answer] = useState(() => dailyAnswer(levelPool, comboKey))
  const { guesses, addGuess } = useDailyProgress(comboKey, levelPool)
  const [query, setQuery] = useState("")
  const [modalOpen, setModalOpen] = useState(false)

  const hasWon = guesses.some((g) => g.id === answer.id)
  const hasLost = !hasWon && guesses.length >= MAX_ROUNDS
  const gameOver = hasWon || hasLost
  const wrongGuesses = guesses.filter((g) => g.id !== answer.id)

  useEffect(() => {
    if (gameOver) setModalOpen(true)
  }, [gameOver])
  const stageIndex = gameOver ? MAX_ROUNDS : Math.min(guesses.length + 1, MAX_ROUNDS)
  const roundNumber = Math.min(guesses.length + 1, MAX_ROUNDS)

  const results = useMemo(() => {
    const trimmed = query.trim()
    if (gameOver || !trimmed) return []
    const guessedIds = new Set(guesses.map((g) => g.id))
    const q = trimmed.toLowerCase()
    return levelPool
      .filter((level) => !guessedIds.has(level.id) && level.name.toLowerCase().includes(q))
      .slice(0, 6)
  }, [query, guesses, gameOver, levelPool])

  function handleSelect(level) {
    addGuess(level)
    setQuery("")
  }

  return (
    <div className="rounds-mode">
      <p className="rounds-mode__prompt">
        {hasWon ? "You got it!" : hasLost ? "Out of rounds" : "Guess today's AREDL level!"}
      </p>

      {onChangeMode && (
        <button type="button" className="rounds-mode__mode-toggle" onClick={onChangeMode}>
          {mode === "easy" ? "Easy Mode" : "Hard Mode"} · Change
        </button>
      )}

      {!gameOver && (
        <>
          <p className="rounds-mode__round-counter">
            Round {roundNumber} of {MAX_ROUNDS}
          </p>

          <div className="rounds-mode__bar">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Type a level name..."
              className="rounds-mode__input"
            />
          </div>

          {results.length > 0 && (
            <div className="rounds-mode__dropdown">
              {results.map((level) => (
                <button
                  key={level.id}
                  type="button"
                  className="rounds-mode__option"
                  onClick={() => handleSelect(level)}
                >
                  {level.name}
                </button>
              ))}
            </div>
          )}
        </>
      )}

      <div className="rounds-mode__hints">
        <div className="rounds-mode__hints-header">
          <span>Clue</span>
          <span>Entry</span>
        </div>
        {HINT_ROWS.map((row) => {
          const unlocked = row.stage <= stageIndex
          const valueClass = [
            "rounds-mode__hint-value",
            unlocked ? "rounds-mode__hint-value--reveal" : "rounds-mode__hint-value--locked",
            row.mono ? "rounds-mode__hint-value--mono" : "",
          ]
            .filter(Boolean)
            .join(" ")

          return (
            <div key={row.key} className="rounds-mode__hint">
              <span className="rounds-mode__hint-label">
                <span className={`rounds-mode__hint-badge${unlocked ? " rounds-mode__hint-badge--lit" : ""}`}>
                  R{row.stage}
                </span>
                {row.label}
              </span>

              {/* Keying on lock state remounts the value on unlock, replaying
                  the reveal animation exactly once instead of on every render. */}
              <span key={unlocked ? "on" : "off"} className={valueClass}>
                {unlocked ? (
                  row.key === "tags" && answer.tags.length ? (
                    answer.tags.map((tag) => (
                      <span key={tag} className="tag-pill tag-pill--neutral">
                        {tag}
                      </span>
                    ))
                  ) : row.key === "thumbnail" ? (
                    <img
                      className="rounds-mode__hint-thumb"
                      src={row.value(answer)}
                      alt={`${answer.name} thumbnail`}
                    />
                  ) : (
                    row.value(answer)
                  )
                ) : (
                  <span className="rounds-mode__sr-only">Locked — unlocks round {row.stage}</span>
                )}
              </span>
            </div>
          )
        })}
      </div>

      {wrongGuesses.length > 0 && (
        <div className="rounds-mode__guesses">
          <p className="rounds-mode__guesses-title">Ruled Out</p>
          <div className="rounds-mode__guess-pills">
            {wrongGuesses.map((level, i) => (
              <span key={level.id} className="rounds-mode__guess-pill">
                <span className="rounds-mode__guess-pill-round">R{i + 1}</span>
                <span className="rounds-mode__guess-pill-name">{level.name}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {gameOver && !modalOpen && (
        <button type="button" className="rounds-mode__view-results" onClick={() => setModalOpen(true)}>
          View Results
        </button>
      )}

      <WinModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        tone={hasWon ? "win" : "loss"}
        gameMode="rounds"
        difficulty={mode}
        answer={answer}
        wrongGuesses={wrongGuesses}
        maxRounds={MAX_ROUNDS}
        onGoHome={onChangeMode}
      />
    </div>
  )
}

export default RoundsMode
