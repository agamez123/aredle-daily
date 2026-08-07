import { LEVELS } from "../data/levels"
import { EASY_MODE_LIMIT, MODE_POOLS } from "../data/modes"
import "./Home.css"

const HARD_PREVIEW =
  LEVELS.find((level) => level.position === Math.round(LEVELS.length / 2)) ??
  LEVELS[Math.floor(LEVELS.length / 2)]
const EASY_PREVIEW = LEVELS.find((level) => level.position === 1) ?? LEVELS[0]

const MODES = [
  {
    key: "easy",
    label: "Easy Mode",
    tagline: "Pointercrate Top",
    count: EASY_MODE_LIMIT,
    description: "Only the demons everyone already knows.",
    preview: EASY_PREVIEW,
    badgeClass: "mode-card__badge--easy",
  },
  {
    key: "hard",
    label: "Hard Mode",
    tagline: "The Full AREDL",
    count: MODE_POOLS.hard.length,
    description: "Every level on the list, top to bottom.",
    preview: HARD_PREVIEW,
    badgeClass: "mode-card__badge--hard",
  },
]

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
            className="mode-card"
            style={{ "--mode-image": `url(/thumbnails/${mode.preview.level_id}.webp)` }}
            onClick={() => onSelectMode(mode.key)}
          >
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
