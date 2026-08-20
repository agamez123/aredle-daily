// Shared logic for the win/loss modal's shareable, Wordle-style result grid.

const ATTRIBUTES = [
  { key: "position", label: "Position" },
  { key: "song", label: "Song" },
  { key: "creator", label: "Creator" },
  { key: "verifier", label: "Verifier" },
  { key: "version", label: "Version" },
]

// Version guesses within this range of the answer read as "close" (amber),
// mirroring the CLOSE_RANGE.version threshold used in LevelSearch's live feedback.
const CLOSE_VERSION_RANGE = 0.15

function attributeStatus(key, guess, answer) {
  if (key === "song" || key === "creator" || key === "verifier") {
    return guess[key] === answer[key] ? "correct" : "wrong"
  }
  const guessVal = key === "version" ? parseFloat(guess.version) : guess[key]
  const answerVal = key === "version" ? parseFloat(answer.version) : answer[key]
  if (guessVal === answerVal) return "correct"
  if (key === "version" && Math.abs(guessVal - answerVal) <= CLOSE_VERSION_RANGE) return "close"
  return "wrong"
}

export function guessStatuses(guess, answer) {
  return ATTRIBUTES.map(({ key, label }) => ({ key, label, status: attributeStatus(key, guess, answer) }))
}

const STATUS_EMOJI = { correct: "🟩", close: "🟨", wrong: "⬛" }

export function statusEmoji(status) {
  return STATUS_EMOJI[status] ?? "⬛"
}

// wrongGuesses excludes the eventual answer; a winning game appends it as the
// final, all-green row (it's never included twice — callers pass wrong guesses only).
export function buildResultRows(wrongGuesses, answer, won) {
  const rows = won ? [...wrongGuesses, answer] : wrongGuesses
  return rows.map((guess) => guessStatuses(guess, answer))
}

// Cosmetic puzzle counter for the share text, not tied to level selection.
const PUZZLE_EPOCH = Date.UTC(2024, 0, 1)
const DAY_MS = 24 * 60 * 60 * 1000

export function getPuzzleNumber() {
  return Math.floor((Date.now() - PUZZLE_EPOCH) / DAY_MS)
}

export function buildShareText({ gameMode, difficulty, wrongGuesses, answer, won, maxRounds }) {
  const rows = buildResultRows(wrongGuesses, answer, won)
  const grid = rows.map((row) => row.map((cell) => statusEmoji(cell.status)).join("")).join("\n")
  const modeLabel = gameMode === "classic" ? "Classic" : "Rounds"
  const difficultyLabel = difficulty === "easy" ? "Easy" : "Hard"
  const puzzleNumber = getPuzzleNumber().toLocaleString()

  const scoreLabel =
    gameMode === "rounds"
      ? `${won ? wrongGuesses.length + 1 : "X"}/${maxRounds}`
      : `${wrongGuesses.length + (won ? 1 : 0)} guesses`

  return [
    `AREDLE ${modeLabel} #${puzzleNumber} ${scoreLabel} (${difficultyLabel})`,
    "",
    grid,
    "",
    typeof window !== "undefined" ? window.location.origin : "",
  ]
    .filter((line) => line !== "")
    .join("\n")
}
