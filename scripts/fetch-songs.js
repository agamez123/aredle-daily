// Resolves every distinct `song` id referenced by the AREDL level list into a
// human-readable song name, and writes a simple { songId: songName } map.
//
// Positive ids are Newgrounds song ids, resolved via the same endpoint the GD
// client itself uses (getGJSongInfo.php). Negative ids refer to the game's
// built-in official soundtrack instead of Newgrounds — there's no server
// lookup for those, so they're resolved from a hardcoded table. The mapping
// (name at table index `-song`) was confirmed against real AREDL data: level
// "Silent clubstep" has song -14, table[14] = "Clubstep"; "MINUSdry" has
// song -4, table[4] = "Dry Out".
//
// Usage: node scripts/fetch-songs.js

import { mkdir, readFile, writeFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, "..")

const LIST_URL = "https://api.aredl.net/v2/api/aredl/levels"
const SONG_INFO_URL = "http://www.boomlings.com/database/getGJSongInfo.php"
const SONG_INFO_SECRET = "Wmfd2893gb7" // the GD client's own public secret for this endpoint

const OUTPUT_PATH = path.join(ROOT, "data", "song-names.json")

const CONCURRENCY = 1
const DELAY_MS = 1500 // boomlings has a tight burst limiter; much faster than this trips it
const COOLDOWN_MS = 60000 // boomlings doesn't send Retry-After, so just wait a fixed stretch
const MAX_COOLDOWNS = 20
const CHECKPOINT_EVERY = 25

// GD's built-in soundtrack, index 0 = the main-menu theme, index 1+ = each
// level's official track in order (Stereo Madness, Back on Track, ...).
const OFFICIAL_SONGS = [
  "Stay Inside Me", "Stereo Madness", "Back on Track", "Polargeist", "Dry Out",
  "Base After Base", "Can't Let Go", "Jumper", "Time Machine", "Cycles",
  "xStep", "Clutterfunk", "Theory of Everything", "Electroman Adventures",
  "Clubstep", "Electrodynamix", "Hexagon Force", "Blast Processing",
  "Theory of Everything 2", "Geometrical Dominator", "Deadlocked", "Fingerdash",
  "The Seven Seas", "Viking Arena", "Airborne Robots", "The Challenge",
  "Payload", "Beast Mode", "Machina", "Years", "Frontlines", "Space Pirates",
  "Striker", "Embers", "Round 1", "Monster Dance Off", "Press Start",
  "Nock Em", "Power Trip",
]

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function officialSongName(songId) {
  return OFFICIAL_SONGS[-songId] ?? null
}

// Response looks like "1~|~489111~|~2~|~Nuke Powder~|~3~|~5093~|~4~|~..."
// i.e. flat alternating key/value pairs joined by "~|~". Key "2" is the name.
function parseSongName(body) {
  if (!body || body.startsWith("-1")) return null
  const parts = body.split("~|~")
  for (let i = 0; i < parts.length - 1; i += 2) {
    if (parts[i] === "2") return parts[i + 1] || null
  }
  return null
}

class RateLimited extends Error {}

async function fetchSongName(songId) {
  const res = await fetch(SONG_INFO_URL, {
    method: "POST",
    // Boomlings 403s Node's default User-Agent; an empty one passes.
    headers: { "Content-Type": "application/x-www-form-urlencoded", "User-Agent": "" },
    body: new URLSearchParams({ secret: SONG_INFO_SECRET, songID: String(songId) }),
  })
  if (res.status === 429) throw new RateLimited()
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for song ${songId}`)
  return parseSongName(await res.text())
}

async function loadExisting() {
  try {
    return JSON.parse(await readFile(OUTPUT_PATH, "utf-8"))
  } catch {
    return {}
  }
}

async function saveNames(names) {
  await mkdir(path.dirname(OUTPUT_PATH), { recursive: true })
  await writeFile(OUTPUT_PATH, JSON.stringify(names, null, 2))
}

// Shared-cooldown worker pool: the first 429 any worker hits pauses every
// worker for a fixed stretch (boomlings sends no Retry-After), then everyone
// resumes. Rate-limited ids are requeued. Checkpoints to disk periodically so
// a long run's progress survives an interruption.
async function runPool(items, worker, concurrency, onCheckpoint) {
  const queue = [...items]
  let cooldownUntil = 0
  let cooldownCount = 0
  let sinceCheckpoint = 0
  let stopped = false

  async function runner() {
    while (queue.length > 0 && !stopped) {
      const now = Date.now()
      if (now < cooldownUntil) {
        await sleep(cooldownUntil - now)
        continue
      }
      const id = queue.shift()
      if (id === undefined) continue
      try {
        await worker(id)
        sinceCheckpoint++
        if (sinceCheckpoint >= CHECKPOINT_EVERY) {
          sinceCheckpoint = 0
          await onCheckpoint()
        }
      } catch (err) {
        if (err instanceof RateLimited) {
          cooldownUntil = Math.max(cooldownUntil, Date.now() + COOLDOWN_MS)
          cooldownCount++
          console.log(`  rate limited, pausing ${COOLDOWN_MS / 1000}s (${queue.length + 1} left)`)
          queue.push(id)
          if (cooldownCount >= MAX_COOLDOWNS) {
            console.log(`  hit ${MAX_COOLDOWNS} cooldowns, stopping for this run.`)
            stopped = true
            return
          }
        } else {
          console.error(`  failed ${id}: ${err.message}`)
        }
      }
      await sleep(DELAY_MS)
    }
  }
  await Promise.all(Array.from({ length: concurrency }, runner))
  return { remaining: queue.length }
}

async function main() {
  console.log("Fetching level list...")
  const list = await fetchJsonList()
  const songIds = [...new Set(list.map((l) => l.song).filter((id) => id !== null && id !== undefined))]
  console.log(`${songIds.length} distinct song ids referenced.`)

  const names = await loadExisting()

  const officialIds = songIds.filter((id) => id < 0)
  for (const id of officialIds) {
    names[id] = officialSongName(id)
  }

  const missingCustomIds = songIds.filter((id) => id > 0 && !(id in names))
  console.log(`${missingCustomIds.length} custom song ids need a lookup (not cached yet).`)

  let resolved = 0
  const { remaining } = await runPool(
    missingCustomIds,
    async (id) => {
      names[id] = await fetchSongName(id)
      resolved++
      if (resolved % 50 === 0) console.log(`  ${resolved}/${missingCustomIds.length}`)
    },
    CONCURRENCY,
    () => saveNames(names)
  )

  await saveNames(names)
  console.log(`Wrote ${Object.keys(names).length} song names to ${path.relative(ROOT, OUTPUT_PATH)}`)
  if (remaining > 0) {
    console.log(`${remaining} songs still unresolved after hitting the cooldown cap — run again later to pick up where this left off.`)
  }
}

async function fetchJsonList() {
  const res = await fetch(LIST_URL, {
    headers: { "User-Agent": "aredle-daily (github.com/renbr/aredle-daily)" },
  })
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${LIST_URL}`)
  return res.json()
}

main().catch((err) => {
  console.error(err)
  process.exitCode = 1
})
