import { useMemo, useState } from "react"
import { MODE_POOLS } from "../data/modes"
import GameResult from "./GameResult"
import "./RoundsMode.css"

const MAX_ROUNDS = 6

// Each row unlocks at a given stage (1-6). Tags and Version share stage 2 so
// all 7 data points fit into exactly 6 rounds without doubling up elsewhere.
const HINT_ROWS = [
  { key: "description", label: "Description", stage: 1, value: (l) => l.description || "No description on record." },
  { key: "tags", label: "Tags", stage: 2, value: (l) => (l.tags.length ? l.tags.join(", ") : "None") },
  { key: "version", label: "Version", stage: 2, value: (l) => l.version },
  { key: "position", label: "Position", stage: 3, value: (l) => `#${l.position}` },
  { key: "creator", label: "Creator", stage: 4, value: (l) => l.creator },
  { key: "verifier", label: "Verifier", stage: 5, value: (l) => l.verifier },
  { key: "song", label: "Song", stage: 6, value: (l) => l.song || "Unknown" },
]

function RoundsMode({ mode, onChangeMode }) {
  const levelPool = MODE_POOLS[mode] ?? MODE_POOLS.hard

  const [answer] = useState(() => levelPool[Math.floor(Math.random() * levelPool.length)])
  const [query, setQuery] = useState("")
  const [guesses, setGuesses] = useState([])
  const [hasWon, setHasWon] = useState(false)

  const hasLost = !hasWon && guesses.length >= MAX_ROUNDS
  const gameOver = hasWon || hasLost
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
    if (level.id === answer.id) {
      setHasWon(true)
    } else {
      setGuesses((prev) => [...prev, level])
    }
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
        {HINT_ROWS.map((row) => {
          const unlocked = row.stage <= stageIndex
          return (
            <div key={row.key} className="rounds-mode__hint">
              <span className="rounds-mode__hint-label">{row.label}</span>
              <span
                className={`rounds-mode__hint-value${unlocked ? "" : " rounds-mode__hint-value--locked"}`}
              >
                {unlocked ? row.value(answer) : "???"}
              </span>
            </div>
          )
        })}
      </div>

      {guesses.length > 0 && (
        <div className="rounds-mode__guesses">
          <p className="rounds-mode__guesses-title">Wrong Guesses</p>
          <div className="rounds-mode__guess-pills">
            {guesses.map((level) => (
              <span key={level.id} className="rounds-mode__guess-pill">
                {level.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {hasWon && (
        <GameResult
          tone="win"
          image={`/thumbnails/${answer.level_id}.webp`}
          eyebrow={`Found in round ${roundNumber} of ${MAX_ROUNDS}`}
          headline={answer.name}
          description={answer.description}
        />
      )}

      {hasLost && (
        <GameResult
          tone="loss"
          icon="✕"
          image={`/thumbnails/${answer.level_id}.webp`}
          eyebrow="Out of rounds"
          headline={answer.name}
          description={answer.description}
        />
      )}
    </div>
  )
}

export default RoundsMode
