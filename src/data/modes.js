import { useEffect, useState } from "react"

// Easy Mode only pulls from the Pointercrate-equivalent top of the list.
export const EASY_MODE_LIMIT = 150

// The level table is ~670KB — the overwhelming majority of the bundle. Keeping
// it behind a dynamic import lets the shell paint immediately and pulls the
// data down as a separate chunk while the player is still on the mode picker.
let poolsPromise = null

export function loadPools() {
  if (!poolsPromise) {
    poolsPromise = import("./levels.js").then(({ LEVELS }) => {
      // levels.js is main-list only — the legacy levels the AREDL API also
      // returns are filtered out at fetch time (scripts/fetch-levels.js).
      return {
        hard: LEVELS,
        easy: LEVELS.filter((level) => level.position <= EASY_MODE_LIMIT),
      }
    })
  }
  return poolsPromise
}

// Kicked off from App on mount so the chunk is usually resolved before anyone
// reaches a game screen.
export function preloadPools() {
  loadPools()
}

export function useLevelPools() {
  const [pools, setPools] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    let active = true
    loadPools().then(
      (loaded) => active && setPools(loaded),
      (err) => active && setError(err)
    )
    return () => {
      active = false
    }
  }, [])

  return { pools, loading: !pools && !error, error }
}
