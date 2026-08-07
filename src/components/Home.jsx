import { EASY_MODE_LIMIT, MODE_POOLS } from "../data/modes"
import "./Home.css"

const MODES = [
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

function Home({ onSelectMode }) {
  return (
    <div className="home">
      <p className="home__prompt">Guess today's AREDL level!</p>
      <p className="home__subtitle">Pick a difficulty to start</p>

      <div className="home__modes">
        {MODES.map((mode) => (
          <button
            key={mode.key}
            type="button"
            className={`mode-card mode-card--${mode.key === "easy" ? "hex" : "horns"}`}
            onClick={() => onSelectMode(mode.key)}
          >
            {mode.key === "easy" ? <HexBackdrop /> : <HornBackdrop />}
            <span className={`mode-card__badge ${mode.badgeClass}`}>{mode.tagline}</span>
            <span className="mode-card__count">{mode.count.toLocaleString()}</span>
            <span className="mode-card__label">{mode.label}</span>
            <span className="mode-card__description">{mode.description}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

export default Home
