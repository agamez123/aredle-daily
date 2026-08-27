import { useMemo, useState } from "react"
import { useGuessGame } from "../hooks/useGuessGame"
import GameOver from "./GameOver"
import LevelAutocomplete from "./LevelAutocomplete"
import "./RoundsMode.css"

export const MAX_ROUNDS = 6

// Candidate hints in reveal order. `available` lets a row drop out when the
// level simply has no such data — 843 of the 1,553 levels carry no description,
// and a round spent on "No description on record" is a wasted round.
const HINT_ROWS = [
  {
    key: "tags",
    label: "Tags",
    available: (l) => l.tags.length > 0,
    value: (l) => l.tags.join(", "),
  },
  {
    key: "version",
    label: "Version",
    available: (l) => Boolean(l.version),
    value: (l) => l.version,
  },
  {
    key: "description",
    label: "Description",
    available: (l) => Boolean(l.description),
    value: (l) => l.description,
  },
  { key: "position", label: "Position", available: () => true, value: (l) => `#${l.position}` },
  { key: "creator", label: "Creator", available: () => true, value: (l) => l.creator },
  { key: "verifier", label: "Verifier", available: () => true, value: (l) => l.verifier },
  {
    key: "song",
    label: "Song",
    available: (l) => Boolean(l.song),
    value: (l) => l.song,
  },
]

// Spreads whatever rows survived across the six rounds, so the last hint always
// lands on the final round no matter how many the level actually has.
function buildHintRows(answer) {
  const rows = HINT_ROWS.filter((row) => row.available(answer))
  return rows.map((row, i) => ({
    ...row,
    stage: rows.length === 1 ? 1 : 1 + Math.round((i * (MAX_ROUNDS - 1)) / (rows.length - 1)),
  }))
}

// The thumbnail is the one clue every level has. It starts unreadable and
// sharpens each round, so there is always something happening even when the
// text hints run thin.
const BLUR_STEPS = [26, 20, 15, 10, 6, 3]

function RoundsMode({ pool, difficulty, isDaily, onChangeMode, onOpenStats }) {
  const game = useGuessGame({
    pool,
    gameMode: "rounds",
    difficulty,
    maxGuesses: MAX_ROUNDS,
    isDaily,
  })
  const { answer, guesses, wrongGuesses, guessedIds, gameOver, won } = game

  const [query, setQuery] = useState("")

  const hintRows = useMemo(() => buildHintRows(answer), [answer])

  const stageIndex = gameOver ? MAX_ROUNDS : Math.min(guesses.length + 1, MAX_ROUNDS)
  const roundNumber = Math.min(guesses.length + 1, MAX_ROUNDS)
  const blur = gameOver ? 0 : BLUR_STEPS[Math.min(stageIndex - 1, BLUR_STEPS.length - 1)]

  const results = useMemo(() => {
    const trimmed = query.trim()
    if (gameOver || !trimmed) return []
    const q = trimmed.toLowerCase()
    return pool
      .filter((level) => !guessedIds.has(level.id) && level.name.toLowerCase().includes(q))
      .slice(0, 6)
  }, [query, guessedIds, gameOver, pool])

  function handleSelect(level) {
    game.guess(level)
    setQuery("")
  }

  const lastGuess = guesses[guesses.length - 1]

  return (
    <div className="rounds-mode">
      <p className="rounds-mode__prompt">
        {won
          ? "You got it!"
          : gameOver
            ? "Out of rounds"
            : isDaily
              ? "Guess today's AREDL level!"
              : "Guess the AREDL level!"}
      </p>

      {onChangeMode && (
        <button type="button" className="rounds-mode__mode-toggle" onClick={onChangeMode}>
          {difficulty === "easy" ? "Easy" : "Hard"} · {isDaily ? "Daily" : "Unlimited"} · Change
        </button>
      )}

      <p aria-live="polite" className="visually-hidden">
        {lastGuess
          ? lastGuess.id === answer.id
            ? `${lastGuess.name} is correct!`
            : `${lastGuess.name} is wrong. Round ${roundNumber} of ${MAX_ROUNDS}.`
          : ""}
      </p>

      <div className="rounds-mode__thumb-frame">
        <img
          className="rounds-mode__thumb"
          src={`/thumbnails/${answer.level_id}.webp`}
          alt={gameOver ? answer.name : "Blurred thumbnail of the level to guess"}
          style={{ filter: `blur(${blur}px)`, transform: `scale(${1 + blur / 100})` }}
        />
      </div>

      {!gameOver && (
        <>
          <p className="rounds-mode__round-counter">
            Round {roundNumber} of {MAX_ROUNDS}
          </p>

          <div className="rounds-mode__bar">
            <LevelAutocomplete
              query={query}
              onQueryChange={setQuery}
              results={results}
              onSelect={handleSelect}
              inputClassName="rounds-mode__input"
              listClassName="rounds-mode__dropdown"
              renderOption={(level) => ({
                className: "rounds-mode__option",
                content: (
                  <>
                    <span>{level.name}</span>
                    <span className="rounds-mode__option-meta">#{level.position}</span>
                  </>
                ),
              })}
            />
          </div>
        </>
      )}

      <div className="rounds-mode__hints">
        {hintRows.map((row) => {
          const unlocked = row.stage <= stageIndex
          return (
            <div key={row.key} className="rounds-mode__hint">
              <span className="rounds-mode__hint-label">{row.label}</span>
              <span
                className={`rounds-mode__hint-value${unlocked ? "" : " rounds-mode__hint-value--locked"}`}
              >
                {unlocked ? row.value(answer) : `Unlocks in round ${row.stage}`}
              </span>
            </div>
          )
        })}
      </div>

      {wrongGuesses.length > 0 && (
        <div className="rounds-mode__guesses">
          <p className="rounds-mode__guesses-title">Wrong Guesses</p>
          <div className="rounds-mode__guess-pills">
            {wrongGuesses.map((level) => (
              <span key={level.id} className="rounds-mode__guess-pill">
                {level.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {gameOver && (
        <GameOver
          won={won}
          answer={answer}
          guesses={guesses}
          gameMode="rounds"
          difficulty={difficulty}
          dayIndex={game.dayIndex}
          maxGuesses={MAX_ROUNDS}
          isDaily={isDaily}
          onNewGame={game.newGame}
          onOpenStats={onOpenStats}
          eyebrow={won ? `Found in round ${guesses.length} of ${MAX_ROUNDS}` : "Out of rounds"}
        />
      )}
    </div>
  )
}

export default RoundsMode
