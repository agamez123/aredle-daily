import { LEVELS } from "./levels"

// Easy Mode only pulls from the Pointercrate-equivalent top of the list.
export const EASY_MODE_LIMIT = 150

export const MODE_POOLS = {
  hard: LEVELS,
  easy: LEVELS.filter((level) => level.position <= EASY_MODE_LIMIT),
}

// Rounds mode ends after this many guesses, win or not. Shared with the
// home screen's "already completed today" check, so it lives here instead
// of as a local constant in RoundsMode.jsx.
export const ROUNDS_MAX_GUESSES = 6
