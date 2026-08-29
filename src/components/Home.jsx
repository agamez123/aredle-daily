import { useState } from "react"
import { EASY_MODE_LIMIT } from "../data/modes"
import { getDayIndex, getPuzzleNumber } from "../lib/daily"
import { track } from "../lib/telemetry"
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

const DIFFICULTIES = [
  {
    key: "easy",
    label: "Easy Mode",
    tagline: "Pointercrate Top",
    badgeClass: "mode-card__badge--easy",
  },
  {
    key: "hard",
    label: "Hard Mode",
    tagline: "The Full AREDL",
    badgeClass: "mode-card__badge--hard",
  },
]

// Decorative hex-emblem backdrop for Easy Mode — a nod to Pointercrate, whose
// curated list this mode pulls from, instead of a level screenshot.
function HexBackdrop() {
  return (
    <span className="mode-card__hex" aria-hidden="true">
      <span className="mode-card__hex-ring mode-card__hex-ring--1-outer" />
      <span className="mode-card__hex-ring mode-card__hex-ring--1-inner" />
      <span className="mode-card__hex-ring mode-card__hex-ring--2-outer" />
      <span className="mode-card__hex-ring mode-card__hex-ring--2-inner" />
      <span className="mode-card__hex-ring mode-card__hex-ring--3-outer" />
      <span className="mode-card__hex-ring mode-card__hex-ring--3-inner" />
      <span className="mode-card__hex-core" />
    </span>
  )
}

// Decorative horn-crest backdrop for Hard Mode — a nod to the devil horns
// above the "A" in the AREDL wordmark, instead of a level screenshot.
function HornBackdrop() {
  return (
    <span className="mode-card__horns" aria-hidden="true">
      <span className="mode-card__halo-glow" />
      <span className="mode-card__halo-ring" />
      <span className="mode-card__horn mode-card__horn--left" />
      <span className="mode-card__horn mode-card__horn--right" />
      <span className="mode-card__horn-gem" />
    </span>
  )
}

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

function Home({ onStart, pools }) {
  const [pendingGameMode, setPendingGameMode] = useState(null)
  const [isDaily, setIsDaily] = useState(true)

  const counts = {
    easy: pools ? pools.easy.length : EASY_MODE_LIMIT,
    hard: pools ? pools.hard.length : null,
  }

  if (pendingGameMode === null) {
    return (
      <div className="home">
        <p className="home__prompt">Welcome to AREDLE!</p>
        <p className="home__subtitle">
          Puzzle #{getPuzzleNumber(getDayIndex())} · pick a gamemode to start
        </p>

        <div className="home__modes home__modes--row">
          {GAME_MODES.map((gm) => (
            <button
              key={gm.key}
              type="button"
              className={`mode-card mode-card--row mode-card--${gm.key === "classic" ? "grid" : "layers"}`}
              onClick={() => setPendingGameMode(gm.key)}
            >
              {gm.key === "classic" ? <GridBackdrop /> : <LayersBackdrop />}
              <span className="mode-card__row-text">
                <span className={`mode-card__badge ${gm.badgeClass}`}>{gm.tagline}</span>
                <span className="mode-card__label">{gm.label}</span>
                <span className="mode-card__description">{gm.description}</span>
              </span>
            </button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="home">
      <button type="button" className="home__back" onClick={() => setPendingGameMode(null)}>
        ← Back
      </button>
      <p className="home__subtitle home__subtitle--lead">Pick a difficulty to start</p>

      {/* Daily is the default and the point of the game; Unlimited is the
          escape hatch for anyone who wants to keep playing after it. */}
      <div className="home__cadence" role="group" aria-label="Puzzle cadence">
        <button
          type="button"
          className={`home__cadence-option${isDaily ? " home__cadence-option--active" : ""}`}
          aria-pressed={isDaily}
          onClick={() => setIsDaily(true)}
        >
          Daily
        </button>
        <button
          type="button"
          className={`home__cadence-option${isDaily ? "" : " home__cadence-option--active"}`}
          aria-pressed={!isDaily}
          onClick={() => setIsDaily(false)}
        >
          Unlimited
        </button>
      </div>

      <div className="home__modes">
        {DIFFICULTIES.map((d) => (
          <button
            key={d.key}
            type="button"
            className={`mode-card mode-card--${d.key === "easy" ? "hex" : "horns"}`}
            onClick={() => {
              track("mode_selected", {
                gameMode: pendingGameMode,
                difficulty: d.key,
                daily: isDaily,
              })
              onStart(pendingGameMode, d.key, isDaily)
            }}
          >
            {d.key === "easy" ? <HexBackdrop /> : <HornBackdrop />}
            <span className={`mode-card__badge ${d.badgeClass}`}>{d.tagline}</span>
            <span className="mode-card__count">
              {counts[d.key] === null ? "—" : counts[d.key].toLocaleString()}
            </span>
            <span className="mode-card__label">{d.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

export default Home
