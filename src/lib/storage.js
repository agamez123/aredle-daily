// Every localStorage touch goes through here. Private-mode browsers and
// storage-blocked embeds throw on access rather than returning null, so the
// game has to keep working with persistence silently unavailable.
const PREFIX = "aredle:v1"

export function readJson(key, fallback = null) {
  try {
    const raw = window.localStorage.getItem(`${PREFIX}:${key}`)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

export function writeJson(key, value) {
  try {
    window.localStorage.setItem(`${PREFIX}:${key}`, JSON.stringify(value))
    return true
  } catch {
    return false
  }
}

export function removeKey(key) {
  try {
    window.localStorage.removeItem(`${PREFIX}:${key}`)
  } catch {
    /* nothing to clean up if storage is unavailable */
  }
}

export function gameKey(gameMode, difficulty) {
  return `game:${gameMode}:${difficulty}`
}

export function statsKey(gameMode, difficulty) {
  return `stats:${gameMode}:${difficulty}`
}
