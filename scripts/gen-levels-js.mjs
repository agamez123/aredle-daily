// One-off generator: builds src/data/levels.js from the raw data sources.
// Not wired into package.json — run manually with `node scripts/gen-levels-js.mjs`
// whenever src/data/levels.json, data/song-names.json, data/song-overrides.json,
// or data/levels-full.json change.

import { readFile, writeFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, "..")

async function readJsonIfExists(filePath, fallback) {
  try {
    return JSON.parse(await readFile(filePath, "utf-8"))
  } catch {
    return fallback
  }
}

const levels = JSON.parse(await readFile(path.join(ROOT, "src/data/levels.json"), "utf-8"))
const songNames = JSON.parse(await readFile(path.join(ROOT, "data/song-names.json"), "utf-8"))
const full = JSON.parse(await readFile(path.join(ROOT, "data/levels-full.json"), "utf-8"))
// Manually/script-resolved songs for levels where AREDL's own `song` id is
// null — see scripts/fetch-nongs.js. Keyed by level.id, not song id.
const songOverrides = await readJsonIfExists(path.join(ROOT, "data/song-overrides.json"), {})
const fullById = new Map(full.map((l) => [l.id, l]))

function resolveSong(songId, levelId) {
  if (songId !== null && songId !== undefined) {
    const resolved = songNames[String(songId)]
    if (resolved) return resolved
  }
  return songOverrides[levelId]?.song ?? null
}

const out = levels.map((l) => ({
  id: l.id,
  level_id: l.level_id,
  name: l.name,
  position: l.position,
  legacy: l.legacy,
  song: resolveSong(l.song, l.id),
  creator: l.creator,
  verifier: l.verifier,
  version: l.version,
  tags: l.tags,
  description: fullById.get(l.id)?.description ?? null,
}))

const body = out
  .map(
    (l) => `  {
    id: ${JSON.stringify(l.id)},
    level_id: ${JSON.stringify(l.level_id)},
    name: ${JSON.stringify(l.name)},
    position: ${JSON.stringify(l.position)},
    legacy: ${JSON.stringify(l.legacy)},
    song: ${JSON.stringify(l.song)},
    creator: ${JSON.stringify(l.creator)},
    verifier: ${JSON.stringify(l.verifier)},
    version: ${JSON.stringify(l.version)},
    tags: ${JSON.stringify(l.tags)},
    description: ${JSON.stringify(l.description)},
  },`
  )
  .join("\n")

const fileContent = `// Real AREDL level data, generated from levels.json + song-names.json + levels-full.json.
// Regenerate with: node scripts/gen-levels-js.mjs
export const LEVELS = [
${body}
]
`

await writeFile(path.join(ROOT, "src/data/levels.js"), fileContent)
console.log(`Wrote ${out.length} levels to src/data/levels.js`)

const withSong = out.filter((l) => l.song !== null).length
const withDesc = out.filter((l) => l.description !== null).length
console.log(`${withSong}/${out.length} have a resolved song name, ${withDesc}/${out.length} have a description.`)
