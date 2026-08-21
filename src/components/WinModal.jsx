import { useEffect, useState } from "react"
import { buildResultRows, buildShareText, statusEmoji } from "../utils/share"
import { track } from "../utils/analytics"
import "./WinModal.css"

function WinModal({
  open,
  onClose,
  tone = "win",
  gameMode,
  difficulty,
  answer,
  wrongGuesses = [],
  maxRounds,
  onGoHome,
}) {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!open) return undefined
    function handleKey(e) {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", handleKey)
    return () => window.removeEventListener("keydown", handleKey)
  }, [open, onClose])

  useEffect(() => {
    if (open) setCopied(false)
  }, [open])

  if (!open || !answer) return null

  const won = tone === "win"
  const totalGuesses = wrongGuesses.length + (won ? 1 : 0)
  const rows = buildResultRows(wrongGuesses, answer, won)
  const shareText = buildShareText({ gameMode, difficulty, wrongGuesses, answer, won, maxRounds })

  async function handleCopy() {
    track("share_clicked", { comboKey: `${gameMode}-${difficulty}`, won })
    try {
      await navigator.clipboard.writeText(shareText)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className="win-modal-overlay" onClick={onClose}>
      <div className={`win-modal win-modal--${tone}`} onClick={(e) => e.stopPropagation()}>
        <button className="win-modal__close" aria-label="Close" onClick={onClose}>
          ×
        </button>

        <div className="win-modal__pills">
          <span className="win-modal__pill">{gameMode === "classic" ? "Classic" : "Rounds"}</span>
          <span className="win-modal__pill win-modal__pill--difficulty">
            {difficulty === "easy" ? "Easy" : "Hard"} Mode
          </span>
        </div>

        <p className="win-modal__eyebrow">{won ? "You got it!" : "Out of guesses"}</p>
        <h2 className="win-modal__title">{answer.name}</h2>

        <img
          className="win-modal__thumbnail"
          src={`/thumbnails/${answer.level_id}.webp`}
          alt={`${answer.name} thumbnail`}
        />

        {answer.description && <p className="win-modal__description">{answer.description}</p>}

        <div className="win-modal__stats">
          <div className="win-modal__stat">
            <strong>{gameMode === "rounds" ? `${won ? totalGuesses : maxRounds}/${maxRounds}` : totalGuesses}</strong>
            <span>{gameMode === "rounds" ? "Rounds" : totalGuesses === 1 ? "Guess" : "Guesses"}</span>
          </div>
          <div className="win-modal__stat">
            <strong>#{answer.position}</strong>
            <span>List Position</span>
          </div>
          <div className="win-modal__stat">
            <strong>{answer.version}</strong>
            <span>Version</span>
          </div>
        </div>

        <div className="win-modal__share">
          <div className="win-modal__grid">
            {rows.map((row, i) => (
              <div
                key={i}
                className="win-modal__grid-row"
                aria-label={row.map((cell) => `${cell.label}: ${cell.status}`).join(", ")}
              >
                {row.map((cell) => (
                  <span key={cell.key} aria-hidden="true">
                    {statusEmoji(cell.status)}
                  </span>
                ))}
              </div>
            ))}
          </div>
          <button type="button" className="win-modal__share-btn" onClick={handleCopy}>
            {copied ? "Copied to clipboard!" : "Copy Results"}
          </button>
        </div>

        <button type="button" className="win-modal__home-btn" onClick={onGoHome}>
          Back to Home
        </button>
      </div>
    </div>
  )
}

export default WinModal
