import { useMemo, useState } from "react"
import { MODE_POOLS } from "../data/modes"
import GameResult from "./GameResult"
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

function hasActiveFilters(filters) {
  return (
    filters.tags.length > 0 ||
    ["positionMin", "positionMax", "song", "creator", "verifier", "version"].some(
      (key) => filters[key].trim() !== ""
    )
  )
}

// How far off a numeric guess can be and still count as "close" (yellow).
const CLOSE_RANGE = { version: 0.15 }

// Position feedback fades from green (exact) to red as the guess gets
// further away, fully red once you're this many ranks off. Easy mode's pool
// is capped at EASY_MODE_LIMIT ranks, so it needs a much tighter range than
// hard mode to still show meaningful color spread.
const POSITION_GRADIENT_RANGE = { easy: 50, hard: 500 }

function positionGradientStyle(diff, mode) {
  const range = POSITION_GRADIENT_RANGE[mode] ?? POSITION_GRADIENT_RANGE.hard
  const t = Math.min(Math.abs(diff), range) / range
  // Square root spreads out the near end of the scale so close guesses read
  // as visibly greener instead of fading toward red in a straight line.
  const closeness = Math.round((1 - Math.sqrt(t)) * 100)
  const color = `color-mix(in srgb, var(--feedback-correct) ${closeness}%, var(--feedback-wrong) ${100 - closeness}%)`
  const ink = `color-mix(in srgb, var(--feedback-correct-ink) ${closeness}%, var(--feedback-wrong-ink) ${100 - closeness}%)`
  return { backgroundColor: color, borderColor: color, color: ink }
}

function numericStatus(key, guess, answer) {
  const guessVal = key === "version" ? parseFloat(guess.version) : guess[key]
  const answerVal = key === "version" ? parseFloat(answer.version) : answer[key]
  const diff = guessVal - answerVal
  if (diff === 0) return { status: "correct" }
  const close = key === "version" && Math.abs(diff) <= CLOSE_RANGE.version
  // Position is a list rank, not a plain number — #1 sits above #40, so a
  // smaller guess means you're already higher on the list and need to move down.
  const direction =
    key === "position" ? (diff < 0 ? "down" : "up") : diff < 0 ? "up" : "down"
  return { status: close ? "close" : "wrong", direction, diff }
}

function exactStatus(guessVal, answerVal) {
  return guessVal === answerVal ? "correct" : "wrong"
}

function GuessRow({ level, answer, mode }) {
  const position = numericStatus("position", level, answer)
  const version = numericStatus("version", level, answer)
  const song = exactStatus(level.song, answer.song)
  const creator = exactStatus(level.creator, answer.creator)
  const verifier = exactStatus(level.verifier, answer.verifier)

  return (
    <div
      className="level-table__row level-table__row--guess"
      style={{ "--row-image": `url(/thumbnails/${level.level_id}.webp)` }}
    >
      <span className="level-table__cell level-table__cell--icon">
        <span className="level-name">{level.name}</span>
      </span>

      <span
        className={`level-table__cell level-table__cell--fill${position.status === "correct" ? " level-table__cell--correct" : ""}`}
        style={position.status === "correct" ? undefined : positionGradientStyle(position.diff, mode)}
      >
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

function LevelSearch({ mode, onChangeMode }) {
  const levelPool = MODE_POOLS[mode] ?? MODE_POOLS.hard

  const allTags = useMemo(
    () => [...new Set(levelPool.flatMap((level) => level.tags))].sort(),
    [levelPool]
  )
  const allVersions = useMemo(
    () =>
      [...new Set(levelPool.map((level) => level.version))].sort(
        (a, b) => parseFloat(a) - parseFloat(b)
      ),
    [levelPool]
  )

  const [answer] = useState(() => levelPool[Math.floor(Math.random() * levelPool.length)])
  const [query, setQuery] = useState("")
  const [guesses, setGuesses] = useState([])
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [filters, setFilters] = useState(EMPTY_FILTERS)

  const hasWon = guesses.some((g) => g.id === answer.id)
  const filtersActive = hasActiveFilters(filters)
  const activeFilterCount =
    filters.tags.length +
    ["positionMin", "positionMax", "song", "creator", "verifier", "version"].filter(
      (key) => filters[key].trim() !== ""
    ).length

  const results = useMemo(() => {
    const trimmed = query.trim()
    if (hasWon || (!trimmed && !filtersActive)) return []
    const guessedIds = new Set(guesses.map((g) => g.id))

    let pool = levelPool.filter((level) => !guessedIds.has(level.id))

    if (trimmed) {
      const posMatch = trimmed.match(/^pos:\s*(\d+)$/i)
      if (posMatch) {
        const posQuery = posMatch[1]
        pool = pool.filter((level) => String(level.position).includes(posQuery))
      } else {
        const q = trimmed.toLowerCase()
        pool = pool.filter((level) => level.name.toLowerCase().includes(q))
      }
    }

    const { positionMin, positionMax, song, creator, verifier, version, tags } = filters

    if (positionMin.trim()) pool = pool.filter((level) => level.position >= Number(positionMin))
    if (positionMax.trim()) pool = pool.filter((level) => level.position <= Number(positionMax))
    if (song.trim()) {
      const q = song.trim().toLowerCase()
      pool = pool.filter((level) => (level.song || "").toLowerCase().includes(q))
    }
    if (creator.trim()) {
      const q = creator.trim().toLowerCase()
      pool = pool.filter((level) => level.creator.toLowerCase().includes(q))
    }
    if (verifier.trim()) {
      const q = verifier.trim().toLowerCase()
      pool = pool.filter((level) => level.verifier.toLowerCase().includes(q))
    }
    if (version) pool = pool.filter((level) => level.version === version)
    if (tags.length > 0) pool = pool.filter((level) => tags.every((tag) => level.tags.includes(tag)))

    return pool.slice(0, 6)
  }, [query, guesses, hasWon, filters, filtersActive, levelPool])

  function handleSelect(level) {
    setGuesses((prev) => [...prev, level])
    setQuery("")
  }

  function updateFilter(key, value) {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  function toggleTagFilter(tag) {
    setFilters((prev) => ({
      ...prev,
      tags: prev.tags.includes(tag) ? prev.tags.filter((t) => t !== tag) : [...prev.tags, tag],
    }))
  }

  function clearFilters() {
    setFilters(EMPTY_FILTERS)
  }

  return (
    <div className="level-search">
      <p className="level-search__prompt">
        {hasWon ? "You got it!" : "Guess today's AREDL level!"}
      </p>

      {onChangeMode && (
        <button type="button" className="level-search__mode-toggle" onClick={onChangeMode}>
          {mode === "easy" ? "Easy Mode" : "Hard Mode"} · Change
        </button>
      )}

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

      {!hasWon && (
        <div className="level-search__filters">
          <button
            type="button"
            className={`level-search__filter-toggle${filtersActive ? " level-search__filter-toggle--active" : ""}`}
            onClick={() => setFiltersOpen((open) => !open)}
          >
            Filters{filtersActive ? ` (${activeFilterCount})` : ""}
            <span className="level-search__filter-caret">{filtersOpen ? "▲" : "▼"}</span>
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
                    value={filters.positionMin}
                    onChange={(e) => updateFilter("positionMin", e.target.value)}
                  />
                  <span>–</span>
                  <input
                    type="number"
                    min="1"
                    placeholder="Max"
                    value={filters.positionMax}
                    onChange={(e) => updateFilter("positionMax", e.target.value)}
                  />
                </div>
              </div>

              <div className="level-search__filter-field">
                <label htmlFor="filter-song">Song</label>
                <input
                  id="filter-song"
                  type="text"
                  placeholder="Contains..."
                  value={filters.song}
                  onChange={(e) => updateFilter("song", e.target.value)}
                />
              </div>

              <div className="level-search__filter-field">
                <label htmlFor="filter-creator">Creator</label>
                <input
                  id="filter-creator"
                  type="text"
                  placeholder="Contains..."
                  value={filters.creator}
                  onChange={(e) => updateFilter("creator", e.target.value)}
                />
              </div>

              <div className="level-search__filter-field">
                <label htmlFor="filter-verifier">Verifier</label>
                <input
                  id="filter-verifier"
                  type="text"
                  placeholder="Contains..."
                  value={filters.verifier}
                  onChange={(e) => updateFilter("verifier", e.target.value)}
                />
              </div>

              <div className="level-search__filter-field">
                <label htmlFor="filter-version">Version</label>
                <select
                  id="filter-version"
                  value={filters.version}
                  onChange={(e) => updateFilter("version", e.target.value)}
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
                      className={`tag-pill tag-pill--filter${filters.tags.includes(tag) ? " tag-pill--filter-active" : ""}`}
                      onClick={() => toggleTagFilter(tag)}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              {filtersActive && (
                <button type="button" className="level-search__filter-clear" onClick={clearFilters}>
                  Clear filters
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {hasWon && (
        <GameResult
          tone="win"
          image={`/thumbnails/${answer.level_id}.webp`}
          eyebrow={`Found in ${guesses.length} ${guesses.length === 1 ? "guess" : "guesses"}`}
          headline={answer.name}
          description={answer.description}
        />
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
              style={{ "--row-image": `url(/thumbnails/${level.level_id}.webp)` }}
              onClick={() => handleSelect(level)}
            >
              <span className="level-table__cell level-table__cell--icon">
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
              <GuessRow key={level.id} level={level} answer={answer} mode={mode} />
            ))}
        </div>
      )}
    </div>
  )
}

export default LevelSearch
