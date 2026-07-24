// Downloads the "cards" thumbnail for every level (keyed by the numeric GD
// level_id, not the AREDL uuid) into public/thumbnails/, skipping any file
// that's already on disk. Self-hosting these means they ride on the same
// CDN as the rest of the static site instead of hammering GitHub's raw
// content servers at runtime.
//
// Usage: node scripts/fetch-thumbnails.js [--limit N]

import { mkdir, readdir, readFile, rename, writeFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, "..")

const thumbnailUrl = (levelId) =>
  `https://raw.githubusercontent.com/All-Rated-Extreme-Demon-List/Thumbnails/refs/heads/main/levels/cards/${levelId}.webp`

const LEVELS_PATH = path.join(ROOT, "src", "data", "levels.json")
const OUTPUT_DIR = path.join(ROOT, "public", "thumbnails")

const CONCURRENCY = 5
const DELAY_MS = 150
const MAX_COOLDOWNS = 60

const limitArg = process.argv.indexOf("--limit")
const LIMIT = limitArg !== -1 ? Number(process.argv[limitArg + 1]) : Infinity

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

class RateLimited extends Error {
  constructor(retryAfterSeconds) {
    super(`rate limited, retry after ${retryAfterSeconds}s`)
    this.retryAfterSeconds = retryAfterSeconds
  }
}

async function fetchImage(url) {
  const res = await fetch(url, {
    headers: { "User-Agent": "aredle-daily (github.com/renbr/aredle-daily)" },
  })
  if (res.status === 429) {
    const retryAfter = Number(res.headers.get("retry-after")) || 15
    throw new RateLimited(retryAfter)
  }
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${url}`)
  return Buffer.from(await res.arrayBuffer())
}

// Same shared-cooldown pool as fetch-levels.js: one 429 pauses every worker
// until Retry-After elapses, then everyone resumes; rate-limited ids are
// requeued instead of dropped.
async function runPool(items, worker, concurrency) {
  const queue = [...items]
  let cooldownUntil = 0
  let cooldownCount = 0
  let succeeded = 0
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
        succeeded++
        if (succeeded % 100 === 0) console.log(`  ${succeeded}/${items.length}`)
      } catch (err) {
        if (err instanceof RateLimited) {
          const waitMs = err.retryAfterSeconds * 1000 + 500
          cooldownUntil = Math.max(cooldownUntil, Date.now() + waitMs)
          cooldownCount++
          console.log(`  rate limited, pausing ${err.retryAfterSeconds}s (${queue.length + 1} left)`)
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
  return { succeeded, remaining: queue.length }
}

async function main() {
  const levels = JSON.parse(await readFile(LEVELS_PATH, "utf-8"))
  await mkdir(OUTPUT_DIR, { recursive: true })

  const existing = new Set(
    (await readdir(OUTPUT_DIR)).map((f) => path.basename(f, ".webp"))
  )

  const missing = levels
    .map((l) => l.level_id)
    .filter((levelId) => levelId != null && !existing.has(String(levelId)))
    .slice(0, LIMIT)

  console.log(`${levels.length} levels, ${existing.size} thumbnails already on disk, ${missing.length} to fetch.`)

  if (missing.length === 0) return

  const { succeeded, remaining } = await runPool(
    missing,
    async (levelId) => {
      const bytes = await fetchImage(thumbnailUrl(levelId))
      const dest = path.join(OUTPUT_DIR, `${levelId}.webp`)
      const tmp = `${dest}.tmp`
      await writeFile(tmp, bytes)
      await rename(tmp, dest) // atomic swap so a crash mid-write can't leave a corrupt thumbnail
    },
    CONCURRENCY
  )

  console.log(`Downloaded ${succeeded} thumbnails this run.`)
  if (remaining > 0) {
    console.log(`${remaining} still missing after hitting the cooldown cap — run again later to pick up where this left off.`)
  }
}

main().catch((err) => {
  console.error(err)
  process.exitCode = 1
})
