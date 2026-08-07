# Aredle Daily

A daily guessing game built around the [AREDL](https://aredl.net) (All Rate Extreme Demon List) — guess the Geometry Dash extreme demon level, Wordle-style, using clues like creator, verifier, position, and tags.

Built with React + Vite.

## Development

```bash
npm install
npm run dev
```

## Level data

`src/data/levels.js` is a generated file — the app's source of truth for level data at runtime. It's built from four source files, each maintained by its own script:

| File | Produced by |
| --- | --- |
| `src/data/levels.json` | `scripts/fetch-levels.js` |
| `data/levels-full.json` | `scripts/fetch-levels.js` |
| `data/song-names.json` | `scripts/fetch-songs.js` |
| `data/song-overrides.json` | `scripts/fetch-nongs.js` |

`scripts/gen-levels-js.mjs` merges all four into `src/data/levels.js`.

### Updating the level list

When AREDL adds, removes, or re-positions levels, refresh the data with:

```bash
npm run fetch-levels    # pulls the current list from api.aredl.net, caches creator/verifier detail
npm run fetch-songs     # resolves any new song ids against boomlings
npm run fetch-nongs     # fills in songs AREDL's API left null (see below)
node scripts/gen-levels-js.mjs   # rebuilds src/data/levels.js from the sources above
```

All three fetch scripts are incremental — they only fetch what's not already cached (`data/level-cache.json`, `data/song-names.json`, `data/song-overrides.json` respectively), so re-running them after a small AREDL update is cheap. Pass `--force` to `fetch-nongs` to re-resolve entries already in its cache.

**Why `fetch-nongs` exists:** AREDL's API frequently leaves a level's `song` field `null` even when the level does have a real song — either a normal Newgrounds/GD track AREDL just never recorded, or a NONG (a custom track swapped in that was never uploaded to Newgrounds, so `fetch-songs.js` has nothing to resolve). `fetch-nongs.js` closes that gap by querying two sources per level:

1. The level's actual song straight off GD's servers (via `gdbrowser.com`, a proxy over boomlings) — reliable when the song is a normal Newgrounds track, but often just a reupload someone made of a NONG, mislabeled under whoever's account it lives on now.
2. [Song File Hub](https://songfilehub.com)'s NONG index (`api.songfilehub.com/songs?levelID=<level_id>`, filtering to `state: "rated"`) — the community-verified original for songs that were swapped in and never touched Newgrounds.

When both resolve and agree, that's used as-is. When they disagree, Song File Hub's name is preferred (it tends to be the real artist/title rather than a reupload's mislabeled one) and GD's version is kept alongside as `alt` in `data/song-overrides.json`. When only one resolves, that one is used. When neither resolves, the level is logged to the console as needing manual research — check those by hand before regenerating, since that's also where a genuinely wrong guess is most likely to hide.

Run `npm run fetch-thumbnails` if new levels need thumbnail images.
