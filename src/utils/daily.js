// Deterministic daily puzzle seeding. Every browser computes the same
// answer for a given UTC date + mode/difficulty combo from data already
// bundled in levels.js, so there's no server call and no shared state to
// stand up — the same trick the original Wordle used (word list shipped in
// the JS bundle, index picked by day).

const PUZZLE_EPOCH = Date.UTC(2024, 0, 1)
const DAY_MS = 24 * 60 * 60 * 1000

export function todayUTC(date = new Date()) {
  return date.toISOString().slice(0, 10)
}

// Days since PUZZLE_EPOCH — the "AREDLE #123" counter used in share text.
export function puzzleNumber(date = new Date()) {
  return Math.floor((date.getTime() - PUZZLE_EPOCH) / DAY_MS)
}

// FNV-1a string hash -> 32-bit unsigned int. Deterministic, no dependency.
function hashString(str) {
  let h = 0x811c9dc5
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}

// comboKey is `${gameMode}-${difficulty}`, e.g. "classic-easy". Each combo
// gets its own independent seed, so knowing one combo's answer for today
// tells you nothing about the other three.
export function dailyAnswer(pool, comboKey, dateStr = todayUTC()) {
  const index = hashString(`${dateStr}:${comboKey}`) % pool.length
  return pool[index]
}
