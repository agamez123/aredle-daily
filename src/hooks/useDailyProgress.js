import { useEffect, useState } from "react"
import { todayUTC } from "../utils/daily"
import { loadProgress, saveProgress, pruneOldProgress } from "../utils/progressStorage"

// Persists one day's guesses for a mode/difficulty combo to localStorage, so
// a finished combo stays finished across reloads and an in-progress one
// resumes instead of restarting from scratch. Win/loss rules stay with the
// caller (they differ between Classic and Rounds) — this hook only
// remembers which levels were guessed, in order.
export function useDailyProgress(comboKey, levelPool) {
  const dateStr = todayUTC()

  const [guesses, setGuesses] = useState(() => {
    pruneOldProgress()
    const record = loadProgress(comboKey, dateStr)
    if (!record) return []
    const byId = new Map(levelPool.map((level) => [level.id, level]))
    return record.guesses.map((id) => byId.get(id)).filter(Boolean)
  })

  useEffect(() => {
    saveProgress(comboKey, dateStr, { guesses: guesses.map((level) => level.id) })
  }, [comboKey, dateStr, guesses])

  function addGuess(level) {
    setGuesses((prev) => [...prev, level])
  }

  return { guesses, addGuess }
}
