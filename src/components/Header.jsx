import { useState } from "react"
import Modal from "./Modal"
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

function Header() {
  const [openModal, setOpenModal] = useState(null)
  const [theme, setTheme] = useState(
    () => document.documentElement.dataset.theme || "dark"
  )

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark"
    setTheme(next)
    document.documentElement.dataset.theme = next
  }

  return (
    <>
      <header className="site-header">
        <span className="site-header__title">AREDLE</span>
        <div className="site-header__icons">
          <button
            className="site-header__icon-btn"
            aria-label="Help"
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
        <p>Guess the daily AREDL level. Each guess reveals how close you were:</p>
        <ul>
          <li>
            <span className="legend-swatch legend-swatch--correct" /> Green — that column matches the answer.
          </li>
          <li>
            <span className="legend-swatch legend-swatch--close" /> Yellow with an arrow — close, the arrow points toward the answer.
          </li>
          <li>
            <span className="legend-swatch legend-swatch--wrong" /> Red — no match.
          </li>
        </ul>
      </Modal>

      <Modal open={openModal === "stats"} title="Statistics" onClose={() => setOpenModal(null)}>
        <div className="stats-grid">
          <div className="stats-grid__item">
            <strong>12</strong>
            <span>Played</span>
          </div>
          <div className="stats-grid__item">
            <strong>92</strong>
            <span>Win %</span>
          </div>
          <div className="stats-grid__item">
            <strong>4</strong>
            <span>Streak</span>
          </div>
          <div className="stats-grid__item">
            <strong>7</strong>
            <span>Max Streak</span>
          </div>
        </div>
        <p className="modal-note">Dummy data for now — real stats coming soon.</p>
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
      </Modal>
    </>
  )
}

export default Header
