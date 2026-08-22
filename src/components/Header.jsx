import { useEffect, useState } from "react"
import Modal from "./Modal"
import { EASY_MODE_LIMIT, MODE_POOLS, ROUNDS_MAX_GUESSES } from "../data/modes"
import { todayUTC } from "../utils/daily"
import { clearAllData, loadStats } from "../utils/statsStorage"
import "./Header.css"

function HelpIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M9.5 9a2.5 2.5 0 0 1 5 0c0 1.5-2.5 2-2.5 3.5" />
      <line x1="12" y1="16.5" x2="12" y2="16.5" />
    </svg>
  )
}

function StatsIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="20" x2="5" y2="12" />
      <line x1="12" y1="20" x2="12" y2="6" />
      <line x1="19" y1="20" x2="19" y2="15" />
    </svg>
  )
}

function SettingsIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  )
}

// ---------------------------------------------------------------- How to Play

function HowToPlay() {
  return (
    <div className="howto">
      <p className="howto__lede">
        One AREDL level is chosen per day. Everyone gets the same level, and it
        resets at midnight UTC. Pick a difficulty, then a mode — each of the four
        combinations has its own puzzle and its own stats.
      </p>

      <section className="howto__section">
        <h3 className="howto__heading">Difficulty</h3>
        <div className="howto__split">
          <div className="howto__card">
            <span className="howto__card-title">Easy</span>
            <p>
              Only the top {EASY_MODE_LIMIT} — the Pointercrate-equivalent slice
              of the list. Levels you’ve probably heard of.
            </p>
          </div>
          <div className="howto__card">
            <span className="howto__card-title">Hard</span>
            <p>
              The full AREDL, all {MODE_POOLS.hard.length} levels. Deep cuts
              included.
            </p>
          </div>
        </div>
      </section>

      <section className="howto__section">
        <h3 className="howto__heading">Classic Mode</h3>
        <p className="howto__body">
          Unlimited guesses. Every guess is graded as a row across six columns —
          position, song, creator, verifier, version and tags — so each one
          narrows the field. Use the filter panel to search by those same
          attributes once you’ve ruled things out.
        </p>
        <ul className="howto__legend">
          <li>
            <span className="legend-swatch legend-swatch--correct" /> Green — that
            column matches exactly.
          </li>
          <li>
            <span className="legend-swatch legend-swatch--close" /> Amber with an
            arrow — close, and the arrow points toward the answer.
          </li>
          <li>
            <span className="legend-swatch legend-swatch--wrong" /> Red — no
            match. Position fades green→red by how far off you are.
          </li>
        </ul>
      </section>

      <section className="howto__section">
        <h3 className="howto__heading">Rounds Mode</h3>
        <p className="howto__body">
          {ROUNDS_MAX_GUESSES} guesses, and that’s it. You start with almost
          nothing; every wrong guess unlocks another clue about the level, so the
          longer you hold out the more you know — and the fewer chances you have
          left to use it.
        </p>
        <ol className="howto__rounds">
          <li><span className="howto__round-badge">R1</span> Tags and version</li>
          <li><span className="howto__round-badge">R2</span> Description and position</li>
          <li><span className="howto__round-badge">R3</span> Creator and verifier</li>
          <li><span className="howto__round-badge">R4</span> Song</li>
          <li><span className="howto__round-badge">R5</span> Thumbnail</li>
          <li><span className="howto__round-badge">R6</span> Last guess, everything on the table</li>
        </ol>
      </section>
    </div>
  )
}

// ------------------------------------------------------------------- Statistics

function StatTile({ value, label }) {
  return (
    <div className="stats-grid__item">
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  )
}

// Rounds is capped at ROUNDS_MAX_GUESSES, so its win-by-round spread fits a
// fixed set of bars. Classic is unbounded and gets average/best figures
// instead of a chart that would need open-ended buckets.
function GuessDistribution({ distribution }) {
  const rounds = Array.from({ length: ROUNDS_MAX_GUESSES }, (_, i) => i + 1)
  const peak = Math.max(1, ...rounds.map((round) => distribution[round] ?? 0))

  return (
    <div className="stats-dist">
      <p className="stats-dist__title">Wins by round</p>
      {rounds.map((round) => {
        const count = distribution[round] ?? 0
        return (
          <div key={round} className="stats-dist__row">
            <span className="stats-dist__round">{round}</span>
            <span className="stats-dist__track">
              <span
                className={`stats-dist__bar${count ? "" : " stats-dist__bar--empty"}`}
                style={{ width: `${(count / peak) * 100}%` }}
              />
            </span>
            <span className="stats-dist__count">{count}</span>
          </div>
        )
      })}
    </div>
  )
}

function Statistics() {
  const [difficulty, setDifficulty] = useState("easy")
  const today = todayUTC()

  const classic = loadStats(`classic-${difficulty}`, today)
  const rounds = loadStats(`rounds-${difficulty}`, today)
  const nothingPlayed = classic.played === 0 && rounds.played === 0

  return (
    <div className="stats">
      <div className="stats__tabs" role="tablist" aria-label="Difficulty">
        {["easy", "hard"].map((key) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={difficulty === key}
            className={`stats__tab${difficulty === key ? " stats__tab--active" : ""}`}
            onClick={() => setDifficulty(key)}
          >
            {key === "easy" ? "Easy" : "Hard"}
          </button>
        ))}
      </div>

      {nothingPlayed && (
        <p className="modal-note stats__empty">
          No finished {difficulty === "easy" ? "Easy" : "Hard"} games yet. Play
          one and it’ll show up here.
        </p>
      )}

      <section className="stats__section">
        <h3 className="stats__heading">Classic</h3>
        <div className="stats-grid">
          <StatTile value={classic.played} label="Solved" />
          <StatTile value={classic.streak} label="Streak" />
          <StatTile value={classic.maxStreak} label="Max Streak" />
          <StatTile
            value={classic.avgGuesses ? classic.avgGuesses.toFixed(1) : "—"}
            label="Avg Guesses"
          />
        </div>
        <p className="stats__footnote">
          {classic.bestGuesses
            ? `Best solve: ${classic.bestGuesses} ${classic.bestGuesses === 1 ? "guess" : "guesses"}.`
            : "Classic has unlimited guesses, so there’s no losing — a day only counts once you solve it."}
        </p>
      </section>

      <section className="stats__section">
        <h3 className="stats__heading">Rounds</h3>
        <div className="stats-grid">
          <StatTile value={rounds.played} label="Played" />
          <StatTile value={`${rounds.winRate}%`} label="Win Rate" />
          <StatTile value={rounds.streak} label="Streak" />
          <StatTile value={rounds.maxStreak} label="Max Streak" />
        </div>
        <GuessDistribution distribution={rounds.distribution} />
      </section>
    </div>
  )
}

// --------------------------------------------------------------------- Settings

function DangerZone() {
  const [confirming, setConfirming] = useState(false)

  // Arming the button is undone by anything else the user does — a stray
  // click shouldn't leave a live wipe button sitting there.
  useEffect(() => {
    if (!confirming) return
    const timer = setTimeout(() => setConfirming(false), 5000)
    return () => clearTimeout(timer)
  }, [confirming])

  function handleClear() {
    clearAllData()
    // Reload rather than trying to reset every in-memory game: a mounted
    // board would just write today's guesses straight back out.
    window.location.reload()
  }

  return (
    <section className="danger-zone">
      <h3 className="danger-zone__heading">Danger Zone</h3>
      <p className="danger-zone__body">
        Erases every statistic and today’s progress in all four mode
        combinations. This can’t be undone.
      </p>
      <button
        type="button"
        className={`danger-zone__btn${confirming ? " danger-zone__btn--armed" : ""}`}
        onClick={() => (confirming ? handleClear() : setConfirming(true))}
      >
        {confirming ? "Tap again to erase everything" : "Clear stats & data"}
      </button>
    </section>
  )
}

function Header({ gameMode, difficulty, onGoHome }) {
  const [openModal, setOpenModal] = useState(null)
  const [theme, setTheme] = useState(
    () => document.documentElement.dataset.theme || "dark"
  )

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark"
    setTheme(next)
    document.documentElement.dataset.theme = next
  }

  const TitleTag = onGoHome ? "button" : "span"

  return (
    <>
      <header className="site-header">
        <TitleTag
          className="site-header__title"
          type={onGoHome ? "button" : undefined}
          onClick={onGoHome}
        >
          <span className="site-header__mark" aria-hidden="true">✦</span>
          AREDLE
          {gameMode && (
            <span className="site-header__mode-pill">
              {gameMode === "classic" ? "Classic" : "Rounds"} · {difficulty === "easy" ? "Easy" : "Hard"}
            </span>
          )}
        </TitleTag>
        <div className="site-header__icons">
          <button
            className="site-header__icon-btn"
            aria-label="How to play"
            onClick={() => setOpenModal("help")}
          >
            <HelpIcon />
          </button>
          <button
            className="site-header__icon-btn"
            aria-label="Statistics"
            onClick={() => setOpenModal("stats")}
          >
            <StatsIcon />
          </button>
          <button
            className="site-header__icon-btn"
            aria-label="Settings"
            onClick={() => setOpenModal("settings")}
          >
            <SettingsIcon />
          </button>
        </div>
      </header>

      <Modal open={openModal === "help"} title="How to Play" onClose={() => setOpenModal(null)}>
        <HowToPlay />
      </Modal>

      {/* Remounted per open so the tiles re-read localStorage — a game
          finished since the last open shows up without a refresh. */}
      <Modal open={openModal === "stats"} title="Statistics" onClose={() => setOpenModal(null)}>
        <Statistics />
      </Modal>

      <Modal open={openModal === "settings"} title="Settings" onClose={() => setOpenModal(null)}>
        <div className="settings-row">
          <span>Dark Mode</span>
          <button
            className="theme-toggle"
            role="switch"
            aria-checked={theme === "dark"}
            onClick={toggleTheme}
          >
            <span className={`theme-toggle__thumb ${theme === "dark" ? "theme-toggle__thumb--on" : ""}`} />
          </button>
        </div>
        <DangerZone />
      </Modal>
    </>
  )
}

export default Header
