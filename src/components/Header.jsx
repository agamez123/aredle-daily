import { useState } from "react"
import Modal from "./Modal"
import StatsPanel from "./StatsPanel"
import { maxGuessesFor } from "../lib/guessLimits"
import { MAX_ROUNDS } from "./RoundsMode"
import { currentTheme, setTheme as persistTheme } from "../lib/theme"
import { getDayIndex, getPuzzleNumber } from "../lib/daily"
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

function ClassicHelp({ difficulty }) {
  return (
    <>
      <p>
        Name the AREDL level in {maxGuessesFor(difficulty)} guesses. Every guess is graded column by
        column against the answer.
      </p>
      <ul>
        <li>
          <span className="legend-swatch legend-swatch--correct" /> Green means that column matches
          exactly.
        </li>
        <li>
          <span className="legend-swatch legend-swatch--close" /> Amber means partly right. Your tags
          overlap the answer&apos;s, or your version is within one release.
        </li>
        <li>
          <span className="legend-swatch legend-swatch--wrong" /> Red means no match.
        </li>
      </ul>
      <p>
        Position uses a sliding scale instead of three colours. The closer your guess sits to the
        answer&apos;s rank, the greener the cell. ▲ means the answer is further down the list, a
        bigger number. ▼ means it&apos;s further up.
      </p>
      <p className="modal-note">
        Type <code>pos:120</code> to search by list position instead of name. Use ↑ ↓ and Enter to
        pick from the keyboard.
      </p>
    </>
  )
}

function RoundsHelp() {
  return (
    <>
      <p>
        Name the AREDL level in {MAX_ROUNDS} rounds. There is no per-column feedback. Every wrong
        guess unlocks another clue and sharpens the thumbnail.
      </p>
      <ul>
        <li>Round 1 opens with the level&apos;s tags and a blurred thumbnail.</li>
        <li>
          Later rounds reveal position, creator, verifier and song. Clues a level doesn&apos;t have
          are skipped, so the reveals always fill all {MAX_ROUNDS} rounds.
        </li>
      </ul>
      <p className="modal-note">Use ↑ ↓ and Enter to pick from the keyboard.</p>
    </>
  )
}

function GeneralHelp() {
  return (
    <>
      <p>
        AREDLE is a daily guessing game built on the{" "}
        <a href="https://aredl.net" target="_blank" rel="noreferrer">
          All Rated Extreme Demon List
        </a>
        . Pick a game mode to start.
      </p>
      <ul>
        <li>
          <strong>Classic</strong> is a grid guesser. Each guess grades position, song, creator,
          verifier, version and tags.
        </li>
        <li>
          <strong>Rounds</strong> unlocks one clue per wrong guess, {MAX_ROUNDS} rounds to get it.
        </li>
      </ul>
      <p>
        <strong>Easy</strong> draws only from the top 150. <strong>Hard</strong> uses the entire
        list.
      </p>
      <p className="modal-note">
        Each board has its own puzzle every day, plus an Unlimited mode if you want to keep playing.
      </p>
    </>
  )
}

function Header({ gameMode, difficulty, isDaily, onGoHome, openModal, onOpenModal, statsToken }) {
  const [theme, setTheme] = useState(currentTheme)

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark"
    setTheme(next)
    persistTheme(next)
  }

  const close = () => onOpenModal(null)
  const TitleTag = onGoHome ? "button" : "span"
  const puzzleNumber = getPuzzleNumber(getDayIndex())

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
              {gameMode === "classic" ? "Classic" : "Rounds"} ·{" "}
              {difficulty === "easy" ? "Easy" : "Hard"}
              {isDaily ? ` · #${puzzleNumber}` : " · ∞"}
            </span>
          )}
        </TitleTag>
        <div className="site-header__icons">
          <button
            className="site-header__icon-btn"
            aria-label="Help"
            onClick={() => onOpenModal("help")}
          >
            <HelpIcon />
          </button>
          <button
            className="site-header__icon-btn"
            aria-label="Statistics"
            onClick={() => onOpenModal("stats")}
          >
            <StatsIcon />
          </button>
          <button
            className="site-header__icon-btn"
            aria-label="Settings"
            onClick={() => onOpenModal("settings")}
          >
            <SettingsIcon />
          </button>
        </div>
      </header>

      <Modal open={openModal === "help"} title="How to play" onClose={close}>
        {gameMode === "classic" ? (
          <ClassicHelp difficulty={difficulty ?? "hard"} />
        ) : gameMode === "rounds" ? (
          <RoundsHelp />
        ) : (
          <GeneralHelp />
        )}
      </Modal>

      <Modal open={openModal === "stats"} title="Statistics" onClose={close}>
        <StatsPanel
          gameMode={gameMode ?? "classic"}
          difficulty={difficulty ?? "hard"}
          refreshToken={statsToken}
        />
      </Modal>

      <Modal open={openModal === "settings"} title="Settings" onClose={close}>
        <div className="settings-row">
          <span>Dark mode</span>
          <button
            className="theme-toggle"
            role="switch"
            aria-checked={theme === "dark"}
            aria-label="Dark mode"
            onClick={toggleTheme}
          >
            <span className={`theme-toggle__thumb ${theme === "dark" ? "theme-toggle__thumb--on" : ""}`} />
          </button>
        </div>
        <p className="modal-note">
          Progress and stats are stored in this browser only. Clearing site data resets them.
          Anonymous usage events (mode picked, game started, guesses, result, share) are sent to
          Umami analytics. No account, no personal data, and nothing that identifies your device.
        </p>
      </Modal>
    </>
  )
}

export default Header
