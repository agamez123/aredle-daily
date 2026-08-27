// Grading rules for a Classic-mode guess. Kept out of the component because
// the share-string builder needs the exact same verdicts the grid renders.

export const GRADED_COLUMNS = ["position", "song", "creator", "verifier", "version", "tags"]

// How far off a numeric guess can be and still count as "close" (amber).
const CLOSE_RANGE = { version: 0.15 }

// Position feedback fades from green (exact) to red as the guess gets further
// away, fully red once you're this many ranks off. Easy mode's pool is capped
// at EASY_MODE_LIMIT ranks, so it needs a much tighter range than hard mode to
// still show meaningful colour spread.
export const POSITION_GRADIENT_RANGE = { easy: 50, hard: 500 }

// A guess counts as a "close" position — amber in the share grid — inside this
// fraction of the gradient range. The grid itself is continuous; the share
// string only has three colours to work with.
const POSITION_CLOSE_FRACTION = 0.1

export function positionGradientStyle(diff, difficulty) {
  const range = POSITION_GRADIENT_RANGE[difficulty] ?? POSITION_GRADIENT_RANGE.hard
  const t = Math.min(Math.abs(diff), range) / range
  // Square root spreads out the near end of the scale so close guesses read as
  // visibly greener instead of fading toward red in a straight line.
  const closeness = Math.round((1 - Math.sqrt(t)) * 100)
  const color = `color-mix(in srgb, var(--feedback-correct) ${closeness}%, var(--feedback-wrong) ${100 - closeness}%)`
  const ink = `color-mix(in srgb, var(--feedback-correct-ink) ${closeness}%, var(--feedback-wrong-ink) ${100 - closeness}%)`
  return { backgroundColor: color, borderColor: color, color: ink }
}

function numericStatus(key, guess, answer, difficulty) {
  const guessVal = key === "version" ? parseFloat(guess.version) : guess[key]
  const answerVal = key === "version" ? parseFloat(answer.version) : answer[key]

  // Four levels carry no GD version at all. Without this they'd produce a NaN
  // diff, which compares false against everything and renders a meaningless
  // arrow — so treat "unknown" as its own verdict instead.
  if (!Number.isFinite(guessVal) || !Number.isFinite(answerVal)) {
    return { status: "unknown", direction: null, diff: null }
  }

  const diff = guessVal - answerVal
  if (diff === 0) return { status: "correct", direction: null, diff: 0 }

  const range = POSITION_GRADIENT_RANGE[difficulty] ?? POSITION_GRADIENT_RANGE.hard
  const close =
    key === "version"
      ? Math.abs(diff) <= CLOSE_RANGE.version
      : Math.abs(diff) <= range * POSITION_CLOSE_FRACTION

  // Position is a list rank, not a plain number — #1 sits above #40, so a
  // smaller guess means you're already higher on the list and need to move down.
  const direction = key === "position" ? (diff < 0 ? "down" : "up") : diff < 0 ? "up" : "down"
  return { status: close ? "close" : "wrong", direction, diff }
}

function exactStatus(guessVal, answerVal) {
  return guessVal === answerVal ? "correct" : "wrong"
}

// Tags are partial-credit: all of the answer's tags and no extras is a full
// match, some overlap is close, none is wrong.
function tagStatus(guess, answer) {
  const answerTags = new Set(answer.tags)
  const shared = guess.tags.filter((tag) => answerTags.has(tag)).length
  if (shared === answerTags.size && guess.tags.length === answerTags.size) return "correct"
  return shared > 0 ? "close" : "wrong"
}

export function gradeGuess(guess, answer, difficulty) {
  return {
    position: numericStatus("position", guess, answer, difficulty),
    version: numericStatus("version", guess, answer, difficulty),
    song: { status: exactStatus(guess.song, answer.song) },
    creator: { status: exactStatus(guess.creator, answer.creator) },
    verifier: { status: exactStatus(guess.verifier, answer.verifier) },
    tags: { status: tagStatus(guess, answer) },
  }
}
