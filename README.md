# Aredle Daily

A daily guessing game built on the [AREDL](https://aredl.net) (All Rated Extreme Demon List). Guess the Geometry Dash extreme demon level, Wordle-style, from clues like creator, verifier, position, and tags.

React + Vite.

## How the game is put together

Every mode is a different view of the same core:

| Piece | What it owns |
| --- | --- |
| `src/hooks/useGuessGame.js` | Answer selection, guess list, win/loss, daily persistence, stat recording |
| `src/components/LevelAutocomplete.jsx` | The search box, its keyboard navigation and combobox wiring |
| `src/lib/grade.js` | Classic's per-column verdicts, shared by the grid and the share string |
| `src/lib/daily.js` | Day index, the seeded puzzle rotation, the next-puzzle countdown |
| `src/lib/stats.js`, `src/lib/storage.js` | Streaks, distribution, and every localStorage touch |

### Daily puzzles

The day rolls over at local midnight. Puzzle #1 is 2026-08-29. Each (game mode,
difficulty) pair walks its own seeded permutation of its pool instead of hashing
straight to an index, so a level never repeats until the whole pool has been
used. Easy Mode cycles every 150 days. Nothing about a day's answer is stored
server-side, and every client derives the same one.

Progress, stats and theme live in `localStorage` under `aredle:v1:*`. Unlimited
mode is deliberately not persisted.

### Level data at runtime

`src/data/levels.js` is ~670KB, so `src/data/modes.js` pulls it in through a
dynamic `import()`. The app shell paints first and the level chunk arrives while
the player is still on the mode picker. Legacy (demoted) levels are filtered out
of both pools.

## Analytics

`src/lib/telemetry.js` reports gameplay to [Umami](https://umami.is). The
tracking script is injected at startup only when `VITE_UMAMI_WEBSITE_ID` is set,
so local dev and any deploy without it do nothing rather than pointing traffic at
someone else's dashboard. `track()` never throws. Analytics must not break
gameplay.

To view the data, create a website on [cloud.umami.is](https://cloud.umami.is)
(or your own instance), copy its website ID into `VITE_UMAMI_WEBSITE_ID` as a
build-time env var on the host, and redeploy. `VITE_` vars are inlined at build
time, so setting one after a deploy does nothing until the next build. The events
below show up under Events on that website's dashboard, and `combo` and the other
props are readable in the event's property breakdown.

| Event | Fired when | Props |
| --- | --- | --- |
| `mode_selected` | A difficulty card is clicked on Home | `gameMode`, `difficulty`, `daily` |
| `game_started` | A board is opened with no guesses on it | `combo`, `gameMode`, `difficulty`, `daily`, `day` |
| `guess_made` | A guess is accepted onto the board | `combo`, `guessNumber`, `correct` |
| `game_won` / `game_lost` | A board resolves | `combo`, `guesses`, `daily`, `day` |
| `share_clicked` | Share result on the game-over card | `combo`, `won`, `guesses`, `copied` |

`combo` is `gameMode:difficulty:daily|unlimited`. Every guard is keyed on the
game's seed, so resuming or reopening a daily board never re-reports a start, its
restored guesses, or its result. An unlimited reroll does count as a new game.
See `.env.example` for the variables.

## Development

```bash
npm install
npm run dev
```

## Level data

`src/data/levels.js` is generated, and it's what the app reads at runtime. Four
source files feed it, each maintained by its own script:

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
npm run fetch-thumbnails # retrieve level card thumbnails
node scripts/gen-levels-js.mjs   # rebuilds src/data/levels.js from the sources above
```

The fetch scripts are incremental. They only fetch what isn't already cached
(`data/level-cache.json`, `data/song-names.json`, `data/song-overrides.json`
respectively), so re-running them after a small AREDL update is cheap. Pass
`--force` to `fetch-nongs` to re-resolve entries already in its cache.

Why `fetch-nongs` exists: AREDL's API often leaves a level's `song` field `null`
even when the level does have a real song. Sometimes it's a normal
Newgrounds/GD track AREDL never recorded, sometimes a NONG, a custom track
swapped in that was never uploaded to Newgrounds, so `fetch-songs.js` has nothing
to resolve. `fetch-nongs.js` closes that gap by querying two sources per level:

1. The level's actual song straight off GD's servers, via `gdbrowser.com`, a
   proxy over boomlings. Reliable when the song is a normal Newgrounds track,
   but often just a reupload of a NONG, mislabeled under whoever's account it
   lives on now.
2. [Song File Hub](https://songfilehub.com)'s NONG index
   (`api.songfilehub.com/songs?levelID=<level_id>`, filtered to
   `state: "rated"`). This is the community-verified original for songs that
   were swapped in and never touched Newgrounds.

When both resolve and agree, that's used as-is. When they disagree, Song File
Hub's name wins, since it tends to be the real artist and title rather than a
reupload's mislabeled one, and GD's version is kept alongside it as `alt` in
`data/song-overrides.json`. When only one resolves, that one is used. When
neither does, the level is logged to the console as needing manual research.
Check those by hand before regenerating. That's where a genuinely wrong guess is
most likely to hide.
