import { useMemo, useState } from "react"
import { useGuessGame } from "../hooks/useGuessGame"
import { gradeGuess, positionGradientStyle } from "../lib/grade"
import { maxGuessesFor } from "../lib/guessLimits"
import GameOver from "./GameOver"
import LevelAutocomplete from "./LevelAutocomplete"
import "./LevelSearch.css"

const COLUMNS = [
  { key: "position", label: "Position" },
  { key: "song", label: "Song" },
  { key: "creator", label: "Creator" },
  { key: "verifier", label: "Verifier" },
  { key: "version", label: "Version" },
  { key: "tags", label: "Tags" },
]

const EMPTY_FILTERS = {
  positionMin: "",
  positionMax: "",
  song: "",
  creator: "",
  verifier: "",
  version: "",
  tags: [],
}

const TEXT_FILTER_KEYS = ["positionMin", "positionMax", "song", "creator", "verifier", "version"]

const TEXT_FILTER_FIELDS = [
  { key: "song", label: "Song" },
  { key: "creator", label: "Creator" },
  { key: "verifier", label: "Verifier" },
]

function activeFilterCount(filters) {
  return filters.tags.length + TEXT_FILTER_KEYS.filter((key) => filters[key].trim() !== "").length
}

// Correct cells get a tick and wrong ones an arrow, so the grid is readable
// without relying on colour alone.
function Verdict({ status, direction }) {
  if (status === "correct") {
    return (
      <span className="level-arrow" aria-hidden="true">
        ✓
      </span>
    )
  }
  if (!direction) return null
  return (
    <span className="level-arrow" aria-hidden="true">
      {direction === "up" ? "▲" : "▼"}
    </span>
  )
}

function GuessRow({ level, answer, difficulty }) {
  const graded = gradeGuess(level, answer, difficulty)

  return (
    <div
      className="level-table__row level-table__row--guess"
      style={{ "--row-image": `url(/thumbnails/${level.level_id}.webp)` }}
    >
      <span className="level-table__cell level-table__cell--icon">
        <span className="level-name">{level.name}</span>
      </span>

      <span
        className={`level-table__cell level-table__cell--fill${graded.position.status === "correct" ? " level-table__cell--correct" : ""}`}
        style={
          graded.position.status === "correct"
            ? undefined
            : positionGradientStyle(graded.position.diff, difficulty)
        }
      >
        {level.position}
        <Verdict status={graded.position.status} direction={graded.position.direction} />
      </span>

      <span
        className={`level-table__cell level-table__cell--fill level-table__cell--wrap level-table__cell--${graded.song.status}`}
      >
        {level.song}
      </span>

      <span
        className={`level-table__cell level-table__cell--fill level-table__cell--${graded.creator.status}`}
      >
        {level.creator}
      </span>

      <span
        className={`level-table__cell level-table__cell--fill level-table__cell--${graded.verifier.status}`}
      >
        {level.verifier}
      </span>

      <span
        className={`level-table__cell level-table__cell--fill level-table__cell--${graded.version.status}`}
      >
        {level.version ?? "—"}
        <Verdict status={graded.version.status} direction={graded.version.direction} />
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

// Announced to screen readers after each guess. Colour is the only feedback the
// grid gives sighted players, so the same verdicts have to exist as text.
function describeGuess(level, answer, difficulty) {
  if (level.id === answer.id) return `${level.name} is correct!`
  const graded = gradeGuess(level, answer, difficulty)
  const parts = COLUMNS.map((col) => {
    const { status, direction } = graded[col.key]
    if (status === "correct") return `${col.label} correct`
    if (status === "unknown") return `${col.label} unknown`
    if (direction) return `${col.label} ${direction === "up" ? "higher" : "lower"}`
    return `${col.label} ${status === "close" ? "partial" : "wrong"}`
  })
  return `${level.name}: ${parts.join(", ")}.`
}

function ColumnHeader() {
  return (
    <div className="level-table__row level-table__row--header">
      <span className="level-table__cell level-table__cell--icon">Level</span>
      {COLUMNS.map((col) => (
        <span key={col.key} className="level-table__cell">
          {col.label}
        </span>
      ))}
    </div>
  )
}

function LevelSearch({ pool, difficulty, isDaily, onChangeMode, onOpenStats }) {
  const maxGuesses = maxGuessesFor(difficulty)
  const game = useGuessGame({
    pool,
    gameMode: "classic",
    difficulty,
    maxGuesses,
    isDaily,
  })
  const { answer, guesses, guessedIds, gameOver, won, remaining } = game

  const allTags = useMemo(() => [...new Set(pool.flatMap((level) => level.tags))].sort(), [pool])
  const allVersions = useMemo(
    () =>
      [...new Set(pool.map((level) => level.version).filter(Boolean))].sort(
        (a, b) => parseFloat(a) - parseFloat(b)
      ),
    [pool]
  )

  const [query, setQuery] = useState("")
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [filters, setFilters] = useState(EMPTY_FILTERS)

  const filterCount = activeFilterCount(filters)
  const filtersActive = filterCount > 0

  const results = useMemo(() => {
    const trimmed = query.trim()
    if (gameOver || (!trimmed && !filtersActive)) return []

    let candidates = pool.filter((level) => !guessedIds.has(level.id))

    if (trimmed) {
      const posMatch = trimmed.match(/^pos:\s*(\d+)$/i)
      if (posMatch) {
        candidates = candidates.filter((level) => String(level.position).includes(posMatch[1]))
      } else {
        const q = trimmed.toLowerCase()
        candidates = candidates.filter((level) => level.name.toLowerCase().includes(q))
      }
    }

    const { positionMin, positionMax, version, tags } = filters
    if (positionMin.trim()) candidates = candidates.filter((l) => l.position >= Number(positionMin))
    if (positionMax.trim()) candidates = candidates.filter((l) => l.position <= Number(positionMax))
    for (const field of TEXT_FILTER_FIELDS) {
      const value = filters[field.key].trim().toLowerCase()
      if (value) candidates = candidates.filter((l) => (l[field.key] || "").toLowerCase().includes(value))
    }
    if (version) candidates = candidates.filter((l) => l.version === version)
    if (tags.length) candidates = candidates.filter((l) => tags.every((tag) => l.tags.includes(tag)))

    return candidates.slice(0, 6)
  }, [query, guessedIds, gameOver, filters, filtersActive, pool])

  function handleSelect(level) {
    game.guess(level)
    setQuery("")
  }

  const lastGuess = guesses[guesses.length - 1]

  return (
    <div className="level-search">
      <p className="level-search__prompt">
        {won
          ? "You got it!"
          : gameOver
            ? "Out of guesses"
            : isDaily
              ? "Guess today's AREDL level!"
              : "Guess the AREDL level!"}
      </p>

      {onChangeMode && (
        <button type="button" className="level-search__mode-toggle" onClick={onChangeMode}>
          {difficulty === "easy" ? "Easy" : "Hard"} · {isDaily ? "Daily" : "Unlimited"} · Change
        </button>
      )}

      <p aria-live="polite" className="visually-hidden">
        {lastGuess ? describeGuess(lastGuess, answer, difficulty) : ""}
      </p>

      {!gameOver && (
        <>
          <p className="level-search__round-counter">
            {remaining} {remaining === 1 ? "guess" : "guesses"} left
          </p>

          <div className="level-search__bar">
            <LevelAutocomplete
              query={query}
              onQueryChange={setQuery}
              results={results}
              onSelect={handleSelect}
              inputClassName="level-search__input"
              listClassName="level-table level-table--results"
              listHeader={<ColumnHeader />}
              renderOption={(level) => ({
                className: "level-table__row level-table__row--option",
                style: { "--row-image": `url(/thumbnails/${level.level_id}.webp)` },
                content: (
                  <>
                    <span className="level-table__cell level-table__cell--icon">
                      <span className="level-name">{level.name}</span>
                    </span>
                    <span className="level-table__cell">{level.position}</span>
                    <span className="level-table__cell level-table__cell--wrap">{level.song}</span>
                    <span className="level-table__cell">{level.creator}</span>
                    <span className="level-table__cell">{level.verifier}</span>
                    <span className="level-table__cell">{level.version ?? "—"}</span>
                    <span className="level-table__cell level-table__cell--tags">
                      {level.tags.join(", ")}
                    </span>
                  </>
                ),
              })}
            />
          </div>

          <div className="level-search__filters">
            <button
              type="button"
              className={`level-search__filter-toggle${filtersActive ? " level-search__filter-toggle--active" : ""}`}
              aria-expanded={filtersOpen}
              onClick={() => setFiltersOpen((open) => !open)}
            >
              Filters{filtersActive ? ` (${filterCount})` : ""}
              <span className="level-search__filter-caret" aria-hidden="true">
                {filtersOpen ? "▲" : "▼"}
              </span>
            </button>

            {filtersOpen && (
              <div className="level-search__filter-panel">
                <div className="level-search__filter-field">
                  <label>Position</label>
                  <div className="level-search__filter-range">
                    <input
                      type="number"
                      min="1"
                      placeholder="Min"
                      aria-label="Minimum position"
                      value={filters.positionMin}
                      onChange={(e) => setFilters((f) => ({ ...f, positionMin: e.target.value }))}
                    />
                    <span>–</span>
                    <input
                      type="number"
                      min="1"
                      placeholder="Max"
                      aria-label="Maximum position"
                      value={filters.positionMax}
                      onChange={(e) => setFilters((f) => ({ ...f, positionMax: e.target.value }))}
                    />
                  </div>
                </div>

                {TEXT_FILTER_FIELDS.map((field) => (
                  <div key={field.key} className="level-search__filter-field">
                    <label htmlFor={`filter-${field.key}`}>{field.label}</label>
                    <input
                      id={`filter-${field.key}`}
                      type="text"
                      placeholder="Contains..."
                      value={filters[field.key]}
                      onChange={(e) => setFilters((f) => ({ ...f, [field.key]: e.target.value }))}
                    />
                  </div>
                ))}

                <div className="level-search__filter-field">
                  <label htmlFor="filter-version">Version</label>
                  <select
                    id="filter-version"
                    value={filters.version}
                    onChange={(e) => setFilters((f) => ({ ...f, version: e.target.value }))}
                  >
                    <option value="">Any</option>
                    {allVersions.map((v) => (
                      <option key={v} value={v}>
                        {v}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="level-search__filter-field level-search__filter-field--tags">
                  <label>Tags</label>
                  <div className="level-search__filter-tags">
                    {allTags.map((tag) => (
                      <button
                        type="button"
                        key={tag}
                        aria-pressed={filters.tags.includes(tag)}
                        className={`tag-pill tag-pill--filter${filters.tags.includes(tag) ? " tag-pill--filter-active" : ""}`}
                        onClick={() =>
                          setFilters((f) => ({
                            ...f,
                            tags: f.tags.includes(tag)
                              ? f.tags.filter((t) => t !== tag)
                              : [...f.tags, tag],
                          }))
                        }
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>

                {filtersActive && (
                  <button
                    type="button"
                    className="level-search__filter-clear"
                    onClick={() => setFilters(EMPTY_FILTERS)}
                  >
                    Clear filters
                  </button>
                )}
              </div>
            )}
          </div>
        </>
      )}

      {gameOver && (
        <GameOver
          won={won}
          answer={answer}
          guesses={guesses}
          gameMode="classic"
          difficulty={difficulty}
          dayIndex={game.dayIndex}
          maxGuesses={maxGuesses}
          isDaily={isDaily}
          onNewGame={game.newGame}
          onOpenStats={onOpenStats}
          eyebrow={
            won
              ? `Found in ${guesses.length} ${guesses.length === 1 ? "guess" : "guesses"}`
              : "Out of guesses"
          }
        />
      )}

      {guesses.length > 0 && (
        <div className="level-table level-table--guesses">
          <p className="level-table__section-title">Your Guesses</p>
          <ColumnHeader />
          {guesses
            .slice()
            .reverse()
            .map((level) => (
              <GuessRow key={level.id} level={level} answer={answer} difficulty={difficulty} />
            ))}
        </div>
      )}
    </div>
  )
}

export default LevelSearch
