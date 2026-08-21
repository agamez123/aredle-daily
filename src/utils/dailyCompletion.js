import { MODE_POOLS, ROUNDS_MAX_GUESSES } from "../data/modes"
import { dailyAnswer, todayUTC } from "./daily"
import { loadProgress } from "./progressStorage"

// Whether today's puzzle for this mode/difficulty combo has already been
// finished (won, or for Rounds mode, run out of guesses). Reads the same
// localStorage record useDailyProgress writes, without needing to mount the
// actual game component — used by the home screen to show a completed
// indicator per combo.
export function isComboComplete(gameMode, difficulty) {
  const pool = MODE_POOLS[difficulty] ?? MODE_POOLS.hard
  const comboKey = `${gameMode}-${difficulty}`
  const record = loadProgress(comboKey, todayUTC())
  if (!record || !record.guesses.length) return false

  const answer = dailyAnswer(pool, comboKey)
  const won = record.guesses.includes(answer.id)
  if (won) return true

  return gameMode === "rounds" && record.guesses.length >= ROUNDS_MAX_GUESSES
}
