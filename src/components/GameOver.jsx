import { useEffect, useState } from "react"
import GameResult from "./GameResult"
import { formatCountdown, msUntilNextPuzzle } from "../lib/daily"
import { buildShareText, copyText } from "../lib/share"
import { comboKey, track } from "../lib/telemetry"
import "./GameOver.css"

function useCountdown(active) {
  const [ms, setMs] = useState(() => msUntilNextPuzzle())
  useEffect(() => {
    if (!active) return
    const id = setInterval(() => setMs(msUntilNextPuzzle()), 1000)
    return () => clearInterval(id)
  }, [active])
  return ms
}

// Everything that happens once a puzzle resolves: the reveal card, the share
// string, and the route out — a countdown to tomorrow in daily, a reroll in
// unlimited.
function GameOver({
  won,
  answer,
  guesses,
  gameMode,
  difficulty,
  dayIndex,
  maxGuesses,
  isDaily,
  onNewGame,
  onOpenStats,
  eyebrow,
}) {
  const [copied, setCopied] = useState(null)
  const countdown = useCountdown(isDaily)

  useEffect(() => {
    if (copied === null) return
    const id = setTimeout(() => setCopied(null), 2200)
    return () => clearTimeout(id)
  }, [copied])

  async function handleShare() {
    const text = buildShareText({
      gameMode,
      difficulty,
      dayIndex,
      guesses,
      answer,
      won,
      maxGuesses,
      isDaily,
    })
    const ok = await copyText(text)
    track("share_clicked", {
      combo: comboKey(gameMode, difficulty, isDaily),
      won,
      guesses: guesses.length,
      copied: ok,
    })
    setCopied(ok)
  }

  return (
    <div className="game-over">
      <GameResult
        tone={won ? "win" : "loss"}
        icon={won ? "✦" : "✕"}
        image={`/thumbnails/${answer.level_id}.webp`}
        eyebrow={eyebrow}
        headline={answer.name}
        description={answer.description}
      />

      <div className="game-over__actions">
        <button type="button" className="game-over__share" onClick={handleShare}>
          {copied === true ? "Copied!" : copied === false ? "Copy failed" : "Share result"}
        </button>

        {onOpenStats && (
          <button type="button" className="game-over__secondary" onClick={onOpenStats}>
            Statistics
          </button>
        )}

        {!isDaily && onNewGame && (
          <button type="button" className="game-over__secondary" onClick={onNewGame}>
            New level
          </button>
        )}
      </div>

      {isDaily && (
        <p className="game-over__countdown">
          Next puzzle in <span className="game-over__clock">{formatCountdown(countdown)}</span>
        </p>
      )}
    </div>
  )
}

export default GameOver
