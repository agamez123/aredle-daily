import { useState } from "react"
import { EASY_MODE_LIMIT, MODE_POOLS } from "../data/modes"
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
    count: EASY_MODE_LIMIT,
    description: "Only the demons everyone already knows.",
    badgeClass: "mode-card__badge--easy",
  },
  {
    key: "hard",
    label: "Hard Mode",
    tagline: "The Full AREDL",
    count: MODE_POOLS.hard.length,
    description: "Every level on the list, top to bottom.",
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

function Home({ onStart }) {
  const [pendingGameMode, setPendingGameMode] = useState(null)

  if (pendingGameMode === null) {
    return (
      <div className="home">
        <p className="home__prompt">Welcome to AREDLE!</p>
        <p className="home__subtitle">Pick a gamemode to start</p>

        <div className="home__modes">
          {GAME_MODES.map((gm) => (
            <button
              key={gm.key}
              type="button"
              className={`mode-card mode-card--${gm.key === "classic" ? "grid" : "layers"}`}
              onClick={() => setPendingGameMode(gm.key)}
            >
              {gm.key === "classic" ? <GridBackdrop /> : <LayersBackdrop />}
              <span className={`mode-card__badge ${gm.badgeClass}`}>{gm.tagline}</span>
              <span className="mode-card__label">{gm.label}</span>
              <span className="mode-card__description">{gm.description}</span>
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
      <p className="home__prompt">Welcome to AREDLE!</p>
      <p className="home__subtitle">Pick a difficulty to start</p>

      <div className="home__modes">
        {DIFFICULTIES.map((d) => (
          <button
            key={d.key}
            type="button"
            className={`mode-card mode-card--${d.key === "easy" ? "hex" : "horns"}`}
            onClick={() => onStart(pendingGameMode, d.key)}
          >
            {d.key === "easy" ? <HexBackdrop /> : <HornBackdrop />}
            <span className={`mode-card__badge ${d.badgeClass}`}>{d.tagline}</span>
            <span className="mode-card__count">{d.count.toLocaleString()}</span>
            <span className="mode-card__label">{d.label}</span>
            <span className="mode-card__description">{d.description}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

export default Home
