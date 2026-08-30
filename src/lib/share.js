import { GRADED_COLUMNS, gradeGuess } from "./grade"
import { getPuzzleNumber } from "./daily"

const SQUARE = { correct: "🟩", close: "🟨", wrong: "🟥", unknown: "⬛" }

const GAME_MODE_LABEL = { classic: "Classic", rounds: "Rounds" }
const DIFFICULTY_LABEL = { easy: "Easy", hard: "Hard" }

export function labelFor(gameMode, difficulty) {
  return `${GAME_MODE_LABEL[gameMode] ?? gameMode} · ${DIFFICULTY_LABEL[difficulty] ?? difficulty}`
}

// Classic shares the full grid: one row per guess, one square per graded
// column. Rounds has no columns to grade, so it shares a single row of
// wrong-guess squares ending in the win.
function buildGrid({ gameMode, difficulty, guesses, answer, won }) {
  if (gameMode === "classic") {
    return guesses
      .map((guess) => {
        const graded = gradeGuess(guess, answer, difficulty)
        return GRADED_COLUMNS.map((key) => SQUARE[graded[key].status] ?? SQUARE.wrong).join("")
      })
      .join("\n")
  }
  const wrong = guesses.filter((guess) => guess.id !== answer.id)
  return wrong.map(() => SQUARE.wrong).join("") + (won ? SQUARE.correct : "")
}

export function buildShareText({
  gameMode,
  difficulty,
  dayIndex,
  guesses,
  answer,
  won,
  maxGuesses,
  isDaily,
}) {
  const scored = won ? guesses.length : "X"
  const heading = isDaily
    ? `AREDLE #${getPuzzleNumber(dayIndex)} · ${labelFor(gameMode, difficulty)}`
    : `AREDLE Unlimited · ${labelFor(gameMode, difficulty)}`

  return [heading, `${scored}/${maxGuesses}`, "", buildGrid({ gameMode, difficulty, guesses, answer, won }),`https://aredle.net`]
    .join("\n")
    .trimEnd()
}

// Clipboard API needs a secure context and can be denied outright, so fall
// back to the old execCommand path before reporting failure to the player.
export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    try {
      const area = document.createElement("textarea")
      area.value = text
      area.setAttribute("readonly", "")
      area.style.position = "fixed"
      area.style.opacity = "0"
      document.body.appendChild(area)
      area.select()
      const ok = document.execCommand("copy")
      document.body.removeChild(area)
      return ok
    } catch {
      return false
    }
  }
}
