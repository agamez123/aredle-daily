import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { getDayIndex, pickDailyLevel, pickRandomLevel } from "../lib/daily"
import { gameKey, readJson, removeKey, writeJson } from "../lib/storage"
import { recordResult } from "../lib/stats"
import { comboKey, track } from "../lib/telemetry"

// Shared game core for every mode. Owns the answer, the guess list, the
// win/loss verdict, daily persistence and stat recording, so a mode component
// only has to decide how to *display* a guess.
export function useGuessGame({ pool, gameMode, difficulty, maxGuesses, isDaily }) {
  const dayIndex = useMemo(() => getDayIndex(), [])
  const storageKey = gameKey(gameMode, difficulty)

  // A restored game and a fresh one have to be set up in the same tick as the
  // answer, or the first render would flash an empty board over a finished
  // puzzle.
  const [state, setState] = useState(() => createGame({ pool, gameMode, difficulty, dayIndex, isDaily, storageKey }))

  const { answer, guesses, seed } = state

  const won = useMemo(() => guesses.some((level) => level.id === answer.id), [guesses, answer])
  const lost = !won && guesses.length >= maxGuesses
  const gameOver = won || lost
  const wrongGuesses = useMemo(
    () => guesses.filter((level) => level.id !== answer.id),
    [guesses, answer]
  )

  const guessedIds = useMemo(() => new Set(guesses.map((level) => level.id)), [guesses])

  const guess = useCallback(
    (level) => {
      setState((prev) => {
        if (prev.guesses.some((g) => g.id === level.id)) return prev
        const alreadyWon = prev.guesses.some((g) => g.id === prev.answer.id)
        if (alreadyWon || prev.guesses.length >= maxGuesses) return prev
        return { ...prev, guesses: [...prev.guesses, level] }
      })
    },
    [maxGuesses]
  )

  // Unlimited only. Bumping the seed re-runs the answer pick without touching
  // the daily puzzle's stored progress.
  const newGame = useCallback(() => {
    setState((prev) => ({ answer: pickRandomLevel(pool), guesses: [], seed: prev.seed + 1 }))
  }, [pool])

  const combo = comboKey(gameMode, difficulty, isDaily)

  // Every analytics guard is keyed on the seed rather than a plain boolean, so
  // an unlimited reroll reports the new board while a remount — StrictMode's
  // double-invoked effects in dev, or reopening today's daily — does not
  // replay what the last session already sent.

  // A board that already has guesses on it was resumed, not started.
  const startedSeedRef = useRef(null)
  useEffect(() => {
    if (startedSeedRef.current === seed || guesses.length > 0) return
    startedSeedRef.current = seed
    track("game_started", { combo, gameMode, difficulty, daily: isDaily, day: dayIndex })
  }, [combo, gameMode, difficulty, isDaily, dayIndex, guesses.length, seed])

  // Tracked off the guess list rather than from inside guess(), so a rejected
  // guess (a duplicate, or one made after the board resolved) never counts.
  // Restored guesses are seeded in at mount so they aren't re-reported.
  const trackedGuessesRef = useRef({ seed, count: guesses.length })
  useEffect(() => {
    const tracked = trackedGuessesRef.current
    const from = tracked.seed === seed ? tracked.count : 0
    for (let i = from; i < guesses.length; i += 1) {
      track("guess_made", {
        combo,
        guessNumber: i + 1,
        correct: guesses[i].id === answer.id,
      })
    }
    trackedGuessesRef.current = { seed, count: guesses.length }
  }, [guesses, answer, combo, seed])

  // Persist daily progress on every change. Unlimited runs are deliberately
  // ephemeral — otherwise a refresh would restore a puzzle the player was free
  // to reroll anyway.
  useEffect(() => {
    if (!isDaily) return
    writeJson(storageKey, {
      day: dayIndex,
      answerId: answer.id,
      guessIds: guesses.map((level) => level.id),
    })
  }, [isDaily, storageKey, dayIndex, answer, guesses])

  // One outcome event per board played to its end. A board that was already
  // over at mount — today's daily, reopened — is counted as reported.
  const outcomeSeedRef = useRef(gameOver ? seed : null)
  useEffect(() => {
    if (!gameOver || outcomeSeedRef.current === seed) return
    outcomeSeedRef.current = seed
    track(won ? "game_won" : "game_lost", {
      combo,
      guesses: guesses.length,
      daily: isDaily,
      day: dayIndex,
    })
  }, [gameOver, won, guesses.length, combo, isDaily, dayIndex, seed])

  // Stats are recorded once, the moment the puzzle resolves. recordResult
  // guards on the stored day too, so a refresh of a finished board is a no-op.
  const recordedRef = useRef(false)
  const [stats, setStats] = useState(null)
  useEffect(() => {
    if (!isDaily || !gameOver || recordedRef.current) return
    recordedRef.current = true
    setStats(
      recordResult({ gameMode, difficulty, dayIndex, won, guessCount: guesses.length, isDaily })
    )
  }, [isDaily, gameOver, won, guesses.length, gameMode, difficulty, dayIndex])

  useEffect(() => {
    recordedRef.current = false
  }, [seed])

  return {
    answer,
    guesses,
    wrongGuesses,
    guessedIds,
    guess,
    newGame,
    won,
    lost,
    gameOver,
    dayIndex,
    stats,
    remaining: Math.max(0, maxGuesses - guesses.length),
  }
}

function createGame({ pool, gameMode, difficulty, dayIndex, isDaily, storageKey }) {
  if (!isDaily) {
    return { answer: pickRandomLevel(pool), guesses: [], seed: 0 }
  }

  const answer = pickDailyLevel(pool, gameMode, difficulty, dayIndex)
  const saved = readJson(storageKey)

  // Anything from a previous day is stale. So is a save whose answer no longer
  // matches — that means the level list was regenerated under the player's
  // feet, and replaying half a board against a different answer is worse than
  // starting clean.
  if (!saved || saved.day !== dayIndex || saved.answerId !== answer.id) {
    if (saved) removeKey(storageKey)
    return { answer, guesses: [], seed: 0 }
  }

  const byId = new Map(pool.map((level) => [level.id, level]))
  const guesses = (saved.guessIds ?? []).map((id) => byId.get(id)).filter(Boolean)
  return { answer, guesses, seed: 0 }
}
