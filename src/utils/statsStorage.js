// Per-combo results ledger. The daily-progress records in progressStorage
// only survive 30 days and only describe today's in-flight guesses, so
// they can't answer "what's my streak?" — this is the long-lived half:
// one dated entry per finished game, per mode/difficulty combo.
//
// Writes are idempotent on (comboKey, dateStr). Resuming a finished game,
// re-rendering, or reopening the tab all re-record the same entry instead
// of inflating the count, which means callers can fire recordResult from an
// effect without tracking whether they've already done it.

const PREFIX = "aredle:stats:"
const MAX_AGE_DAYS = 400
const DAY_MS = 24 * 60 * 60 * 1000

function storage() {
  try {
    const probe = "__aredle_probe__"
    window.localStorage.setItem(probe, "1")
    window.localStorage.removeItem(probe)
    return window.localStorage
  } catch {
    return null
  }
}

function readLedger(comboKey) {
  const store = storage()
  if (!store) return {}
  try {
    const raw = store.getItem(`${PREFIX}${comboKey}`)
    const parsed = raw ? JSON.parse(raw) : null
    return parsed && typeof parsed === "object" ? parsed : {}
  } catch {
    return {}
  }
}

// Drops entries past MAX_AGE_DAYS. Generous compared to the 30-day progress
// window — a streak is only interesting if it can span months.
function pruneLedger(ledger, referenceDate) {
  const cutoff = referenceDate.getTime() - MAX_AGE_DAYS * DAY_MS
  const kept = {}
  for (const [dateStr, entry] of Object.entries(ledger)) {
    const time = new Date(`${dateStr}T00:00:00Z`).getTime()
    if (Number.isFinite(time) && time >= cutoff) kept[dateStr] = entry
  }
  return kept
}

export function recordResult(comboKey, dateStr, { won, guesses }) {
  const store = storage()
  if (!store) return
  try {
    const ledger = pruneLedger(readLedger(comboKey), new Date())
    const existing = ledger[dateStr]
    // Already recorded identically — skip the write entirely so a resumed
    // game doesn't churn localStorage on every render.
    if (existing && existing.won === won && existing.guesses === guesses) return
    ledger[dateStr] = { won, guesses }
    store.setItem(`${PREFIX}${comboKey}`, JSON.stringify(ledger))
  } catch {
    // Storage blocked or full — stats just stop accruing, game plays on.
  }
}

function dayBefore(dateStr) {
  const time = new Date(`${dateStr}T00:00:00Z`).getTime()
  return new Date(time - DAY_MS).toISOString().slice(0, 10)
}

// Consecutive won days walking backwards from `today`. A day that was
// played and lost breaks the streak, and so does a day that wasn't played
// at all — with one exception: today not being played yet doesn't break a
// streak that's otherwise current, so the number doesn't read as zero all
// morning before you've had a chance to play.
function currentStreak(ledger, today) {
  let cursor = ledger[today]?.won ? today : dayBefore(today)
  let streak = 0
  while (ledger[cursor]?.won) {
    streak++
    cursor = dayBefore(cursor)
  }
  return streak
}

function maxStreak(ledger) {
  const wonDays = Object.keys(ledger)
    .filter((dateStr) => ledger[dateStr].won)
    .sort()
  let best = 0
  let run = 0
  let previous = null
  for (const dateStr of wonDays) {
    run = previous && dayBefore(dateStr) === previous ? run + 1 : 1
    best = Math.max(best, run)
    previous = dateStr
  }
  return best
}

// Aggregates one combo's ledger into everything the Statistics modal shows.
// `distribution` is keyed by guess count and only covers wins — a loss has
// no meaningful bar to sit in.
export function loadStats(comboKey, today) {
  const ledger = readLedger(comboKey)
  const entries = Object.values(ledger)
  const wins = entries.filter((entry) => entry.won)
  const winGuesses = wins.map((entry) => entry.guesses).filter(Number.isFinite)

  const distribution = {}
  for (const count of winGuesses) {
    distribution[count] = (distribution[count] ?? 0) + 1
  }

  return {
    played: entries.length,
    wins: wins.length,
    winRate: entries.length ? Math.round((wins.length / entries.length) * 100) : 0,
    streak: currentStreak(ledger, today),
    maxStreak: maxStreak(ledger),
    avgGuesses: winGuesses.length
      ? winGuesses.reduce((sum, n) => sum + n, 0) / winGuesses.length
      : null,
    bestGuesses: winGuesses.length ? Math.min(...winGuesses) : null,
    distribution,
  }
}

// Danger-zone wipe: every key this app owns, stats and daily progress
// alike. Deliberately matched on the shared `aredle:` prefix so a future
// storage module is covered without having to remember to update this.
export function clearAllData() {
  const store = storage()
  if (!store) return
  try {
    for (let i = store.length - 1; i >= 0; i--) {
      const key = store.key(i)
      if (key && key.startsWith("aredle:")) store.removeItem(key)
    }
  } catch {
    // Nothing recoverable to do — the caller reloads either way.
  }
}
