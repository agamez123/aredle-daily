// Fills in songs AREDL's own API left null. Two sources, queried per level:
//
//  - GD's own servers (via gdbrowser, a thin proxy over boomlings) — the
//    level's actual declared song. Reliable when the song is a normal
//    Newgrounds track, but often just a reupload some editor made of a NONG,
//    mislabeled under whoever's account it lives on now.
//  - Song File Hub's NONG index — community-catalogued replacements for
//    songs that were swapped in and never touched Newgrounds at all. Its
//    "rated" entry (as opposed to fan "remix"/"mashup" submissions) is the
//    community-verified original.
//
// When both resolve and roughly agree, that's the highest-confidence case.
// When only one resolves, that's used with a lower confidence tag. When
// they disagree, Song File Hub's name is preferred (see README) and GD's
// name is kept alongside as `alt` so a human can sanity-check it. When
// neither resolves, the level is left for manual research.
//
// Usage: node scripts/fetch-nongs.js [--force]
//   --force   re-resolve levels already in the cache, not just new ones

import { mkdir, readFile, writeFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, "..")

const GD_LEVEL_URL = (id) => `https://gdbrowser.com/api/level/${id}`
const SFH_SONGS_URL = (id) => `https://api.songfilehub.com/songs?levelID=${id}`

const LEVELS_PATH = path.join(ROOT, "src", "data", "levels.json")
const OUTPUT_PATH = path.join(ROOT, "data", "song-overrides.json")

const DELAY_MS = 900 // gdbrowser's burst limiter is tight; boomlings gets hit through it
const COOLDOWN_MS = 60000
const MAX_COOLDOWNS = 20
const CHECKPOINT_EVERY = 10

const FORCE = process.argv.includes("--force")

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function norm(s) {
  return (s || "").toLowerCase().replace(/[^a-z0-9]/g, "")
}

class RateLimited extends Error {}

// gdbrowser doesn't send a 429 when it rate-limits you — it returns 200 with
// a plain-text warning instead of JSON, so an unparseable body is the signal.
async function fetchGdSong(levelId) {
  const res = await fetch(GD_LEVEL_URL(levelId), {
    headers: { "User-Agent": "aredle-daily (github.com/renbr/aredle-daily)" },
  })
  if (res.status === 429) throw new RateLimited()
  const text = await res.text()
  let data
  try {
    data = JSON.parse(text)
  } catch {
    throw new RateLimited()
  }
  if (data.error || !data.songName) return null
  return { songName: data.songName, songAuthor: data.songAuthor || null }
}

async function fetchSfhRated(levelId) {
  const res = await fetch(SFH_SONGS_URL(levelId))
  if (res.status === 429) throw new RateLimited()
  if (!res.ok) return null
  const data = await res.json()
  const rated = data.filter((d) => d.state === "rated")
  return rated.length === 1 ? rated[0].songName : null
}

function decide(gd, sfhName) {
  const gdFull = gd ? (gd.songAuthor ? `${gd.songAuthor} - ${gd.songName}` : gd.songName) : null
  const hasGd = !!gdFull
  const hasSfh = !!sfhName

  if (hasGd && hasSfh) {
    const gdN = norm(gdFull)
    const sfhN = norm(sfhName)
    const agree = sfhN.includes(gdN) || gdN.includes(sfhN) || (gd.songAuthor && sfhN.includes(norm(gd.songAuthor)))
    if (agree) return { song: sfhName, source: "both agree", alt: null }
    return { song: sfhName, source: "songfilehub (NONG)", alt: gdFull }
  }
  if (hasSfh) return { song: sfhName, source: "songfilehub (NONG)", alt: null }
  if (hasGd) return { song: gdFull, source: "GD server", alt: null }
  return { song: null, source: "none", alt: null }
}

async function loadExisting() {
  try {
    return JSON.parse(await readFile(OUTPUT_PATH, "utf-8"))
  } catch {
    return {}
  }
}

async function saveOverrides(overrides) {
  await mkdir(path.dirname(OUTPUT_PATH), { recursive: true })
  await writeFile(OUTPUT_PATH, JSON.stringify(overrides, null, 2))
}

// Same shared-cooldown worker pool pattern as fetch-levels.js / fetch-songs.js:
// a rate limit pauses everyone, the id goes back on the queue, and progress
// checkpoints to disk periodically so a long run survives an interruption.
async function runPool(items, worker, onCheckpoint) {
  const queue = [...items]
  let cooldownUntil = 0
  let cooldownCount = 0
  let sinceCheckpoint = 0

  while (queue.length > 0) {
    const now = Date.now()
    if (now < cooldownUntil) {
      await sleep(cooldownUntil - now)
      continue
    }
    const item = queue.shift()
    try {
      await worker(item)
      sinceCheckpoint++
      if (sinceCheckpoint >= CHECKPOINT_EVERY) {
        sinceCheckpoint = 0
        await onCheckpoint()
      }
    } catch (err) {
      if (err instanceof RateLimited) {
        cooldownUntil = Date.now() + COOLDOWN_MS
        cooldownCount++
        console.log(`  rate limited, pausing ${COOLDOWN_MS / 1000}s (${queue.length + 1} left)`)
        queue.push(item)
        if (cooldownCount >= MAX_COOLDOWNS) {
          console.log(`  hit ${MAX_COOLDOWNS} cooldowns, stopping for this run.`)
          return { remaining: queue.length }
        }
      } else {
        console.error(`  failed ${item.id}: ${err.message}`)
      }
    }
    await sleep(DELAY_MS)
  }
  return { remaining: 0 }
}

async function main() {
  const levels = JSON.parse(await readFile(LEVELS_PATH, "utf-8"))
  const overrides = await loadExisting()

  const targets = levels.filter((l) => (l.song === null || l.song === undefined) && (FORCE || !overrides[l.id]))
  console.log(`${targets.length} levels need song resolution${FORCE ? " (--force: re-checking cached too)" : ""}.`)

  if (targets.length === 0) {
    console.log("Nothing to do.")
    return
  }

  const counts = { "both agree": 0, "songfilehub (NONG)": 0, "GD server": 0, none: 0 }

  const { remaining } = await runPool(
    targets,
    async (level) => {
      const [gd, sfhName] = await Promise.all([
        fetchGdSong(level.level_id).catch((err) => {
          if (err instanceof RateLimited) throw err
          return null
        }),
        fetchSfhRated(level.level_id).catch((err) => {
          if (err instanceof RateLimited) throw err
          return null
        }),
      ])
      const result = decide(gd, sfhName)
      counts[result.source]++
      overrides[level.id] = {
        ...result,
        level_id: level.level_id,
        name: level.name,
        position: level.position,
      }
    },
    () => saveOverrides(overrides)
  )

  await saveOverrides(overrides)

  console.log(
    `Resolved: ${counts["both agree"]} both agree, ${counts["songfilehub (NONG)"]} songfilehub only, ${counts["GD server"]} GD only, ${counts.none} unresolved.`
  )
  console.log(`Wrote ${Object.keys(overrides).length} overrides to ${path.relative(ROOT, OUTPUT_PATH)}`)

  const needsReview = Object.values(overrides).filter((o) => o.source === "none" || o.alt)
  if (needsReview.length > 0) {
    console.log(`\n${needsReview.length} entries worth a manual look before regenerating (no data, or sources disagreed):`)
    for (const o of needsReview) {
      console.log(`  #${o.position} ${o.name}: ${o.song ?? "(unresolved)"}${o.alt ? ` [GD reupload says: ${o.alt}]` : ""}`)
    }
  }

  if (remaining > 0) {
    console.log(`\n${remaining} levels still unresolved after hitting the cooldown cap — run again later to pick up where this left off.`)
  }
}

main().catch((err) => {
  console.error(err)
  process.exitCode = 1
})
