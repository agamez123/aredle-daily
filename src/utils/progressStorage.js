// Thin localStorage wrapper for daily-progress records. Every call is
// wrapped so a browser that blocks storage (Safari private mode, some
// embedded webviews) degrades to "no persistence" instead of crashing —
// the game still works, it just can't remember what you played today.

const PREFIX = "aredle:progress:"
const MAX_AGE_DAYS = 30
const DAY_MS = 24 * 60 * 60 * 1000

function keyFor(comboKey, dateStr) {
  return `${PREFIX}${comboKey}:${dateStr}`
}

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

export function loadProgress(comboKey, dateStr) {
  const store = storage()
  if (!store) return null
  try {
    const raw = store.getItem(keyFor(comboKey, dateStr))
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function saveProgress(comboKey, dateStr, record) {
  const store = storage()
  if (!store) return
  try {
    store.setItem(keyFor(comboKey, dateStr), JSON.stringify(record))
  } catch {
    // Storage full or blocked mid-session — nothing to do but keep playing
    // with in-memory state only.
  }
}

// Drops progress records older than MAX_AGE_DAYS so localStorage doesn't
// accumulate forever. Cheap, best-effort, safe to call on every mount.
export function pruneOldProgress(referenceDate = new Date()) {
  const store = storage()
  if (!store) return
  try {
    const cutoff = referenceDate.getTime() - MAX_AGE_DAYS * DAY_MS
    for (let i = store.length - 1; i >= 0; i--) {
      const key = store.key(i)
      if (!key || !key.startsWith(PREFIX)) continue
      const dateStr = key.slice(key.lastIndexOf(":") + 1)
      const recordDate = new Date(`${dateStr}T00:00:00Z`).getTime()
      if (Number.isFinite(recordDate) && recordDate < cutoff) {
        store.removeItem(key)
      }
    }
  } catch {
    // Best-effort cleanup only — a failure here shouldn't break the game.
  }
}
