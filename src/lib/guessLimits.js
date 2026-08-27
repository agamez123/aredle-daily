// Classic's guess budget scales with difficulty: Easy draws from a much smaller
// pool than Hard, so Hard gets proportionally more room to narrow things down.
export const MAX_GUESSES_BY_DIFFICULTY = { easy: 20, hard: 40 }

export function maxGuessesFor(difficulty) {
  return MAX_GUESSES_BY_DIFFICULTY[difficulty] ?? MAX_GUESSES_BY_DIFFICULTY.hard
}
