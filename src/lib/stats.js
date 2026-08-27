import { readJson, writeJson, removeKey, statsKey } from "./storage"

export const EMPTY_STATS = {
  played: 0,
  wins: 0,
  currentStreak: 0,
  maxStreak: 0,
  lastDay: null,
  // Guess count -> times won in that many guesses. Drives the distribution bars.
  distribution: {},
}

export function readStats(gameMode, difficulty) {
  return { ...EMPTY_STATS, ...readJson(statsKey(gameMode, difficulty), {}) }
}

// Recorded exactly once per puzzle, guarded by `lastDay`: the result screen
// re-renders (and re-mounts on refresh) long after the game ended, and without
// the guard every one of those would count as another play.
export function recordResult({ gameMode, difficulty, dayIndex, won, guessCount }) {
  const stats = readStats(gameMode, difficulty)
  if (stats.lastDay === dayIndex) return stats

  const continued = stats.lastDay === dayIndex - 1
  const currentStreak = won ? (continued ? stats.currentStreak : 0) + 1 : 0

  const next = {
    played: stats.played + 1,
    wins: stats.wins + (won ? 1 : 0),
    currentStreak,
    maxStreak: Math.max(stats.maxStreak, currentStreak),
    lastDay: dayIndex,
    distribution: won
      ? { ...stats.distribution, [guessCount]: (stats.distribution[guessCount] ?? 0) + 1 }
      : stats.distribution,
  }
  writeJson(statsKey(gameMode, difficulty), next)
  return next
}

export function resetStats(gameMode, difficulty) {
  removeKey(statsKey(gameMode, difficulty))
}

export function winPercent(stats) {
  return stats.played ? Math.round((stats.wins / stats.played) * 100) : 0
}
