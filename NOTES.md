# AREDLE DAILY GAME:

## OPTION 1 (*): Bandle style "Rounds" design

## OPTION 2 (%): LIKE mobs in MCDLE


Data Points:

- Level Name
- Difficulty (position) *
- Creator %
- Verifier  + VIDEO %/*
- Version created *
- Tags (various) %/*
- edel enjoyment (unreliable)
- Thumbnail
- Description (unreliable)
- Song (unreliable)


CURRENT API ENDPOINTS:

https://api.aredl.net/v2/api/aredl/levels
- Returns ALL levels in one go, as a big array of objects (not paginated). Each object looks like:
```json
{
	"id": "94fddf8f-5edf-4db6-8ba7-9106d5b67d08",
	"name": "Society",
	"position": 1,
	"publisher_id": "9e66153c-3064-4628-b791-aa2a9c783abe",
	"points": 5000,
	"legacy": false,
	"level_id": 127323087,
	"two_player": false,
	"tags": [
		"2.2",
		"Long",
		"NONG",
		"Fast-Paced",
		"Timings",
		"Chokepoints",
		"Ship",
		"Wave"
	],
	"description": "The sequel to Escalator and a nerfed impossible level. Featuring a dreamcore/weirdcore aesthetic, it is filled with references and explores themes of mental instability. Currently the hardest rated level in Geometry Dash.",
	"song": null,
	"edel_enjoyment": null,
	"is_edel_pending": false,
	"gddl_tier": 39,
	"nlw_tier": null
}
```
    - `position` = list rank/difficulty placement
    - `publisher_id` = creator's ID (need another lookup to resolve to a name)
    - `legacy` = whether it's been demoted off the main list
    - `level_id` = the actual in-game GD level ID
    - `tags`, `description`, `song`, `edel_enjoyment` can be null/empty depending on the level


https://api.aredl.net/v2/api/aredl/levels/{level-id}
- Same fields as the list endpoint, but for a single level, plus resolved `publisher` and `verifications`:
```json
{
	"id": "94fddf8f-5edf-4db6-8ba7-9106d5b67d08",
	"position": 1,
	"name": "Society",
	"points": 5000,
	"legacy": false,
	"level_id": 127323087,
	"two_player": false,
	"tags": [
		"2.2",
		"Long",
		"NONG",
		"Fast-Paced",
		"Timings",
		"Chokepoints",
		"Ship",
		"Wave"
	],
	"description": "The sequel to Escalator and a nerfed impossible level. Featuring a dreamcore/weirdcore aesthetic, it is filled with references and explores themes of mental instability. Currently the hardest rated level in Geometry Dash.",
	"song": null,
	"edel_enjoyment": null,
	"is_edel_pending": false,
	"gddl_tier": 39,
	"nlw_tier": null,
	"publisher": {
		"id": "9e66153c-3064-4628-b791-aa2a9c783abe",
		"username": "ec99836c7",
		"global_name": "Neomarbilan"
	},
	"verifications": [
		{
			"id": "04aa98c4-b0ce-4c75-8388-50389cfc4678",
			"submitted_by": {
				"id": "baca2bcc-c9b7-421a-aa5e-f02c08b3e74a",
				"username": "7cbaa5a44",
				"global_name": "wPopoff"
			},
			"mobile": false,
			"video_url": "https://www.youtube.com/watch?v=3CoEaH1CM7o",
			"hide_video": false,
			"achieved_at": "2026-06-24T14:00:06Z",
			"created_at": "2026-06-24T14:05:24.746715Z",
			"updated_at": "2026-06-24T14:05:24.746715Z"
		}
	]
}
```
    - `publisher` = resolved creator object (id, username, global_name) — no need for a separate lookup here
    - `verifications` = array of verification runs; each has `submitted_by` (verifier), `video_url`, `mobile`, `achieved_at`
    - This is where you'd get the verifier + video data noted in the Data Points list above


https://raw.githubusercontent.com/All-Rated-Extreme-Demon-List/Thumbnails/refs/heads/main/levels/full/{level-id}.webp
    - Returns thumbnails of the selected level

https://raw.githubusercontent.com/All-Rated-Extreme-Demon-List/Thumbnails/refs/heads/main/levels/cards/{level-id}.webp
    - Optional /cards endpoint returns trimmed 'slit' view of the thumbnail