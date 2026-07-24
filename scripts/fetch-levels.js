// Pulls the AREDL level list, resolves creator/verifier via the per-level
// endpoint only for levels we haven't resolved before, and writes the data
// the frontend consumes.
//
// Usage: node scripts/fetch-levels.js [--limit N]
//   --limit N   only resolve details for the first N uncached levels (testing)

import { mkdir, readFile, writeFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, "..")

const LIST_URL = "https://api.aredl.net/v2/api/aredl/levels"
const levelUrl = (id) => `https://api.aredl.net/v2/api/aredl/levels/${id}`

const CACHE_PATH = path.join(ROOT, "data", "level-cache.json")
const OUTPUT_PATH = path.join(ROOT, "src", "data", "levels.json")
const FULL_OUTPUT_PATH = path.join(ROOT, "data", "levels-full.json")

const CONCURRENCY = 3
const DELAY_MS = 400

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

async function fetchJson(url) {
  const res = await fetch(url, {
    headers: { "User-Agent": "aredle-daily (github.com/renbr/aredle-daily)" },
  })
  if (res.status === 429) {
    const retryAfter = Number(res.headers.get("retry-after")) || 15
    throw new RateLimited(retryAfter)
  }
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${url}`)
  return res.json()
}

async function loadCache() {
  try {
    return JSON.parse(await readFile(CACHE_PATH, "utf-8"))
  } catch {
    return {}
  }
}

async function saveCache(cache) {
  await mkdir(path.dirname(CACHE_PATH), { recursive: true })
  await writeFile(CACHE_PATH, JSON.stringify(cache, null, 2))
}

const MAX_COOLDOWNS = 60 // safety cap: bail out after ~this many 429 pauses
const CHECKPOINT_EVERY = 25 // flush the cache to disk this often so a crash can't lose progress

// Bounded-concurrency worker pool with a *shared* cooldown: the first 429 any
// worker hits pauses every worker until the server's Retry-After elapses,
// then everyone resumes. Rate-limited ids are requeued rather than dropped.
// Periodically checkpoints via onCheckpoint so a crash mid-run loses at most
// a few requests' worth of progress instead of the whole run.
async function runPool(items, worker, concurrency, onCheckpoint) {
  const queue = [...items]
  let cooldownUntil = 0
  let cooldownCount = 0
  let succeeded = 0
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
        succeeded++
        sinceCheckpoint++
        if (succeeded % 50 === 0) console.log(`  ${succeeded}/${items.length}`)
        if (sinceCheckpoint >= CHECKPOINT_EVERY) {
          sinceCheckpoint = 0
          await onCheckpoint()
        }
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

// The version (e.g. "2.2") rides along inside `tags` in the API response;
// the frontend wants it split out as its own field.
function splitVersion(tags) {
  const versionTag = tags?.find((t) => /^\d+\.\d+$/.test(t))
  return {
    version: versionTag ?? null,
    tags: (tags ?? []).filter((t) => t !== versionTag),
  }
}

async function main() {
  console.log("Fetching level list...")
  const list = await fetchJson(LIST_URL)
  console.log(`Got ${list.length} levels.`)

  const cache = await loadCache()
  // Safety net: if something crashes the process outright (e.g. an
  // undici/network fault that doesn't surface as a normal rejection),
  // flush whatever progress we have instead of losing the whole run.
  process.on("uncaughtException", async (err) => {
    console.error("Uncaught exception, flushing cache before exit:", err)
    await saveCache(cache)
    process.exitCode = 1
  })
  process.on("unhandledRejection", async (err) => {
    console.error("Unhandled rejection, flushing cache before exit:", err)
    await saveCache(cache)
    process.exitCode = 1
  })
  const missingIds = list.map((l) => l.id).filter((id) => !cache[id]).slice(0, LIMIT)
  console.log(`${missingIds.length} levels need a detail fetch (not cached yet).`)

  if (missingIds.length > 0) {
    const { succeeded, remaining } = await runPool(
      missingIds,
      async (id) => {
        const detail = await fetchJson(levelUrl(id))
        cache[id] = {
          publisher: detail.publisher,
          verifications: detail.verifications,
          fetchedAt: new Date().toISOString(),
        }
      },
      CONCURRENCY,
      () => saveCache(cache)
    )

    await saveCache(cache)
    console.log(`Cache updated: ${path.relative(ROOT, CACHE_PATH)} (${Object.keys(cache).length} entries, +${succeeded} this run)`)

    if (remaining > 0) {
      console.log(`${remaining} levels still unresolved after hitting the cooldown cap — run again later to pick up where this left off.`)
    }
  }

  const output = list.map((l) => {
    const { version, tags } = splitVersion(l.tags)
    const detail = cache[l.id]
    const verifier = detail?.verifications?.[0]?.submitted_by

    return {
      id: l.id,
      level_id: l.level_id,
      name: l.name,
      position: l.position,
      legacy: l.legacy,
      song: l.song,
      creator: detail?.publisher?.global_name ?? detail?.publisher?.username ?? null,
      verifier: verifier?.global_name ?? verifier?.username ?? null,
      version,
      tags,
    }
  })

  await mkdir(path.dirname(OUTPUT_PATH), { recursive: true })
  await writeFile(OUTPUT_PATH, JSON.stringify(output, null, 2))
  console.log(`Wrote ${output.length} levels to ${path.relative(ROOT, OUTPUT_PATH)}`)

  // The list endpoint returns several fields the frontend doesn't currently
  // use (points, description, edel_enjoyment, etc). Keep those around too,
  // separately, in case they're useful later.
  const fullOutput = list.map((l) => {
    const { version, tags } = splitVersion(l.tags)
    const detail = cache[l.id]
    const verifier = detail?.verifications?.[0]?.submitted_by

    return {
      id: l.id,
      level_id: l.level_id,
      name: l.name,
      position: l.position,
      points: l.points,
      legacy: l.legacy,
      two_player: l.two_player,
      song: l.song,
      description: l.description,
      edel_enjoyment: l.edel_enjoyment,
      is_edel_pending: l.is_edel_pending,
      gddl_tier: l.gddl_tier,
      nlw_tier: l.nlw_tier,
      creator: detail?.publisher?.global_name ?? detail?.publisher?.username ?? null,
      verifier: verifier?.global_name ?? verifier?.username ?? null,
      verifications: detail?.verifications ?? null,
      version,
      tags,
    }
  })

  await mkdir(path.dirname(FULL_OUTPUT_PATH), { recursive: true })
  await writeFile(FULL_OUTPUT_PATH, JSON.stringify(fullOutput, null, 2))
  console.log(`Wrote ${fullOutput.length} levels to ${path.relative(ROOT, FULL_OUTPUT_PATH)}`)
}

main().catch((err) => {
  console.error(err)
  process.exitCode = 1
})
