import { useMemo, useState } from "react"
import { LEVELS } from "../data/levels"
import "./LevelSearch.css"

const COLUMNS = [
  { key: "position", label: "Position" },
  { key: "song", label: "Song" },
  { key: "creator", label: "Creator" },
  { key: "verifier", label: "Verifier" },
  { key: "version", label: "Version" },
  { key: "tags", label: "Tags" },
]

// How far off a numeric guess can be and still count as "close" (yellow).
const CLOSE_RANGE = { position: 2, version: 0.15 }

function numericStatus(key, guess, answer) {
  const guessVal = key === "version" ? parseFloat(guess.version) : guess[key]
  const answerVal = key === "version" ? parseFloat(answer.version) : answer[key]
  const diff = guessVal - answerVal
  if (diff === 0) return { status: "correct" }
  const close = Math.abs(diff) <= CLOSE_RANGE[key]
  // Position is a list rank, not a plain number — #1 sits above #40, so a
  // smaller guess means you're already higher on the list and need to move down.
  const direction =
    key === "position" ? (diff < 0 ? "down" : "up") : diff < 0 ? "up" : "down"
  return { status: close ? "close" : "wrong", direction }
}

function exactStatus(guessVal, answerVal) {
  return guessVal === answerVal ? "correct" : "wrong"
}

function GuessRow({ level, answer }) {
  const position = numericStatus("position", level, answer)
  const version = numericStatus("version", level, answer)
  const song = exactStatus(level.song, answer.song)
  const creator = exactStatus(level.creator, answer.creator)
  const verifier = exactStatus(level.verifier, answer.verifier)

  return (
    <div className="level-table__row level-table__row--guess">
      <span className="level-table__cell level-table__cell--icon">
        <span className="level-thumb level-thumb--lg" />
        <span className="level-name">{level.name}</span>
      </span>

      <span className={`level-table__cell level-table__cell--fill level-table__cell--${position.status}`}>
        {level.position}
        {position.status !== "correct" && (
          <span className="level-arrow">{position.direction === "up" ? "▲" : "▼"}</span>
        )}
      </span>

      <span className={`level-table__cell level-table__cell--fill level-table__cell--wrap level-table__cell--${song}`}>
        {level.song}
      </span>

      <span className={`level-table__cell level-table__cell--fill level-table__cell--${creator}`}>
        {level.creator}
      </span>

      <span className={`level-table__cell level-table__cell--fill level-table__cell--${verifier}`}>
        {level.verifier}
      </span>

      <span className={`level-table__cell level-table__cell--fill level-table__cell--${version.status}`}>
        {level.version}
        {version.status !== "correct" && (
          <span className="level-arrow">{version.direction === "up" ? "▲" : "▼"}</span>
        )}
      </span>

      <span className="level-table__cell level-table__cell--tags">
        {level.tags.map((tag) => (
          <span
            key={tag}
            className={`tag-pill tag-pill--${answer.tags.includes(tag) ? "correct" : "wrong"}`}
          >
            {tag}
          </span>
        ))}
      </span>
    </div>
  )
}

function LevelSearch() {
  const [answer] = useState(() => LEVELS[Math.floor(Math.random() * LEVELS.length)])
  const [query, setQuery] = useState("")
  const [guesses, setGuesses] = useState([])

  const hasWon = guesses.some((g) => g.id === answer.id)

  const results = useMemo(() => {
    if (!query.trim() || hasWon) return []
    const q = query.toLowerCase()
    const guessedIds = new Set(guesses.map((g) => g.id))
    return LEVELS.filter(
      (level) => !guessedIds.has(level.id) && level.name.toLowerCase().includes(q)
    ).slice(0, 6)
  }, [query, guesses, hasWon])

  function handleSelect(level) {
    setGuesses((prev) => [...prev, level])
    setQuery("")
  }

  return (
    <div className="level-search">
      <p className="level-search__prompt">
        {hasWon ? "You got it!" : "Guess today's AREDL level!"}
      </p>

      {!hasWon && (
        <div className="level-search__bar">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a level name..."
            className="level-search__input"
          />
        </div>
      )}

      {hasWon && (
        <p className="level-search__win">
          🎉 The level was <strong>{answer.name}</strong>, guessed in {guesses.length}{" "}
          {guesses.length === 1 ? "try" : "tries"}!
        </p>
      )}

      {results.length > 0 && (
        <div className="level-table">
          <div className="level-table__row level-table__row--header">
            <span className="level-table__cell level-table__cell--icon">Level</span>
            {COLUMNS.map((col) => (
              <span key={col.key} className="level-table__cell">
                {col.label}
              </span>
            ))}
          </div>

          {results.map((level) => (
            <button
              key={level.id}
              className="level-table__row level-table__row--option"
              onClick={() => handleSelect(level)}
            >
              <span className="level-table__cell level-table__cell--icon">
                <span className="level-thumb" />
                <span className="level-name">{level.name}</span>
              </span>
              <span className="level-table__cell">{level.position}</span>
              <span className="level-table__cell level-table__cell--wrap">{level.song}</span>
              <span className="level-table__cell">{level.creator}</span>
              <span className="level-table__cell">{level.verifier}</span>
              <span className="level-table__cell">{level.version}</span>
              <span className="level-table__cell level-table__cell--tags">
                {level.tags.join(", ")}
              </span>
            </button>
          ))}
        </div>
      )}

      {guesses.length > 0 && (
        <div className="level-table level-table--guesses">
          <p className="level-table__section-title">Your Guesses</p>
          <div className="level-table__row level-table__row--header">
            <span className="level-table__cell level-table__cell--icon">Level</span>
            {COLUMNS.map((col) => (
              <span key={col.key} className="level-table__cell">
                {col.label}
              </span>
            ))}
          </div>

          {guesses
            .slice()
            .reverse()
            .map((level) => (
              <GuessRow key={level.id} level={level} answer={answer} />
            ))}
        </div>
      )}
    </div>
  )
}

export default LevelSearch
