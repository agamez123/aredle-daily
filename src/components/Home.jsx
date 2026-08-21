import { useState } from "react"
import { EASY_MODE_LIMIT, MODE_POOLS } from "../data/modes"
import { isComboComplete } from "../utils/dailyCompletion"
import { track } from "../utils/analytics"
import "./Home.css"

const GAME_MODES = [
  {
    key: "classic",
    label: "Classic Mode",
    tagline: "Grid Guesser",
    description: "Every guess instantly grades position, song, creator & more.",
    badgeClass: "mode-card__badge--classic",
  },
  {
    key: "rounds",
    label: "Rounds Mode",
    tagline: "6 Rounds",
    description: "Each wrong guess reveals a new clue about the level.",
    badgeClass: "mode-card__badge--rounds",
  },
]

// Classic Mode's backdrop: a 3x3 grid icon, echoing the column-by-column
// grading grid that mode is built around.
function GridBackdrop() {
  return (
    <span className="mode-card__icon-wrap" aria-hidden="true">
      <span className="mode-card__icon-glow mode-card__icon-glow--classic" />
      <svg
        className="mode-card__icon mode-card__icon--classic"
        viewBox="0 0 24 24"
        width="72"
        height="72"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
      >
        <rect x="3" y="3" width="6" height="6" rx="1" />
        <rect x="9.5" y="3" width="6" height="6" rx="1" />
        <rect x="16" y="3" width="5" height="6" rx="1" />
        <rect x="3" y="9.5" width="6" height="6" rx="1" />
        <rect x="9.5" y="9.5" width="6" height="6" rx="1" />
        <rect x="16" y="9.5" width="5" height="6" rx="1" />
        <rect x="3" y="16" width="6" height="5" rx="1" />
        <rect x="9.5" y="16" width="6" height="5" rx="1" />
        <rect x="16" y="16" width="5" height="5" rx="1" />
      </svg>
    </span>
  )
}

// Shown on a mode row once today's puzzle for the selected difficulty has
// already been played — easy and hard track separately, so this reflects
// whichever difficulty is currently toggled, not "completed at all today."
function CompleteBadge() {
  return (
    <span className="mode-card__complete" role="img" aria-label="Completed today">
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
      </svg>
    </span>
  )
}

// Rounds Mode's backdrop: concentric rings, echoing clues closing in on the
// answer round by round.
function LayersBackdrop() {
  return (
    <span className="mode-card__icon-wrap" aria-hidden="true">
      <span className="mode-card__icon-glow mode-card__icon-glow--rounds" />
      <svg
        className="mode-card__icon mode-card__icon--rounds"
        viewBox="0 0 24 24"
        width="72"
        height="72"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
      >
        <circle cx="12" cy="12" r="2.4" />
        <circle cx="12" cy="12" r="5.6" opacity="0.75" />
        <circle cx="12" cy="12" r="8.8" opacity="0.5" />
        <circle cx="12" cy="12" r="11.5" opacity="0.28" />
      </svg>
    </span>
  )
}

function Home({ onStart }) {
  const [difficulty, setDifficulty] = useState("easy")

  return (
    <div className="home">
      <p className="home__prompt">Welcome to AREDLE!</p>
      <p className="home__subtitle">Pick a difficulty, then a gamemode to start</p>

      <div className="difficulty-toggle" role="tablist" aria-label="Difficulty">
        <span
          className={`difficulty-toggle__thumb${difficulty === "hard" ? " difficulty-toggle__thumb--hard" : ""}`}
          aria-hidden="true"
        />
        <button
          type="button"
          role="tab"
          aria-selected={difficulty === "easy"}
          className={`difficulty-toggle__option${difficulty === "easy" ? " difficulty-toggle__option--active-easy" : ""}`}
          onClick={() => setDifficulty("easy")}
        >
          <span className="difficulty-toggle__label">Easy Mode</span>
          <span className="difficulty-toggle__hint">Pointercrate Top {EASY_MODE_LIMIT}</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={difficulty === "hard"}
          className={`difficulty-toggle__option${difficulty === "hard" ? " difficulty-toggle__option--active-hard" : ""}`}
          onClick={() => setDifficulty("hard")}
        >
          <span className="difficulty-toggle__label">Hard Mode</span>
          <span className="difficulty-toggle__hint">Full AREDL · {MODE_POOLS.hard.length}</span>
        </button>
      </div>

      <div className="home__modes home__modes--row">
        {GAME_MODES.map((gm) => (
          <button
            key={gm.key}
            type="button"
            className={`mode-card mode-card--row mode-card--${gm.key === "classic" ? "grid" : "layers"}`}
            onClick={() => {
              track("mode_selected", { gameMode: gm.key, difficulty })
              onStart(gm.key, difficulty)
            }}
          >
            {gm.key === "classic" ? <GridBackdrop /> : <LayersBackdrop />}
            <span className="mode-card__row-text">
              <span className={`mode-card__badge ${gm.badgeClass}`}>{gm.tagline}</span>
              <span className="mode-card__label">{gm.label}</span>
              <span className="mode-card__description">{gm.description}</span>
            </span>
            {isComboComplete(gm.key, difficulty) && <CompleteBadge />}
          </button>
        ))}
      </div>
    </div>
  )
}

export default Home
