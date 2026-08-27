import { hashString, shuffle } from "./random"

// Puzzle #1 is 2026-01-01, local time. Rollover is local midnight (like Wordle)
// rather than UTC, so "today's puzzle" always matches the player's own date.
const EPOCH = Date.UTC(2026, 0, 1)
const DAY_MS = 86400000

// Days since the epoch for a given local date. Built from local Y/M/D pushed
// through Date.UTC so DST shifts can't knock the count off by one.
export function getDayIndex(date = new Date()) {
  const local = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  return Math.round((local - EPOCH) / DAY_MS)
}

// What players see: puzzle #1 on day 0.
export function getPuzzleNumber(dayIndex) {
  return dayIndex + 1
}

// Milliseconds until the next local midnight, for the "next puzzle" countdown.
export function msUntilNextPuzzle(now = new Date()) {
  const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
  return next.getTime() - now.getTime()
}

export function formatCountdown(ms) {
  const total = Math.max(0, Math.floor(ms / 1000))
  const h = String(Math.floor(total / 3600)).padStart(2, "0")
  const m = String(Math.floor((total % 3600) / 60)).padStart(2, "0")
  const s = String(total % 60).padStart(2, "0")
  return `${h}:${m}:${s}`
}

// Walks a seeded permutation of the pool rather than hashing straight to an
// index, so no level repeats until the whole pool has been used. Easy mode
// (150 levels) therefore cycles cleanly every 150 days instead of throwing up
// the same answer twice in a fortnight.
const orderCache = new Map()

function orderFor(poolSize, seedKey) {
  const cacheKey = `${seedKey}:${poolSize}`
  let order = orderCache.get(cacheKey)
  if (!order) {
    order = shuffle(
      Array.from({ length: poolSize }, (_, i) => i),
      hashString(cacheKey)
    )
    orderCache.set(cacheKey, order)
  }
  return order
}

// Deterministic answer for a given day. Each (gameMode, difficulty) pair gets
// its own permutation, so Classic-Hard and Rounds-Hard are different puzzles.
export function pickDailyLevel(pool, gameMode, difficulty, dayIndex) {
  if (!pool.length) return null
  const order = orderFor(pool.length, `${gameMode}:${difficulty}`)
  return pool[order[((dayIndex % order.length) + order.length) % order.length]]
}

export function pickRandomLevel(pool) {
  return pool[Math.floor(Math.random() * pool.length)]
}
