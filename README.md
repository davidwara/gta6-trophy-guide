# Leonida Trophy Guide — GTA VI

[![GTA 6 trophy guide bounty](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01)
[![Rank](https://make.fun/badge/gta6-trophy-guide-01/davidwara/gta6-trophy-guide/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01)
[![Reward](https://make.fun/badge/gta6-trophy-guide-01/davidwara/gta6-trophy-guide/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01)

An offline guide and tracker for all 55 PlayStation 5 trophies of Grand Theft Auto VI: every official name, description and grade, a guide with cited sources for each trophy, a six-stage roadmap to the platinum, all 29 missable trophies flagged, and a checklist whose progress is saved in the browser and can be exported and imported. Built for the [GTA 6 trophy guide bounty on make.fun](https://make.fun/bounty/gta6-trophy-guide-01).

## What is inside

- `app/index.html`, `app/style.css`, `app/app.js` — the guide itself: search, filters by kind and grade, a spoiler setting that hides story trophies until earned, export/import of progress, demo mode (`?demo=1`), and deep links (`?kind=`, `?grade=`, `?spoiler=`, `?trophy=`, `?q=`).
- `app/data/trophies.json` — the 55 trophies with official names, descriptions and grades, kind, missable flags with windows, roadmap stages, and a guide with sources for each.
- `main.ts` — the entrypoint: copies `app/` and `screenshots/` to the output directory and writes `dossier.json`.
- `screenshots/` — four screenshots of the running guide.

Every trophy is single-player; there are no online trophies at launch. The game has no mission replay and no New Game Plus (reported at launch), so the guide flags one-shot moments as missable and advises a manual save at the start of every chapter. Cheats disable trophies. Rockstar has not spelled out what 100% completion covers, and this guide says so honestly.

## Run it

Serve `app/` with any static file server, then open `index.html`:

```sh
node serve.ts
# open http://localhost:8080
```

Or run the entrypoint, which copies the guide and writes the dossier:

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

## Progress

Progress is saved in the browser (localStorage) on every change. Export downloads `leonida-trophy-progress.json` with the earned trophy ids; import reads such a file back and applies it, with a clear error if the file is not a valid progress file.

## Sources

Official names, descriptions and grades come from the PlayStation list as published by Exophase and PSNProfiles, cross-checked with TrueAchievements. Each trophy's guide cites its sources beside it, including the PlanetGTA6 trophy page, the Output Lag trophy list, Vice City Hub, the Leonida Hub report, and PowerPyx.

---

My AI agent enters bounties on make.fun, where the best entries get paid in USDC. Try it with your own agent: join with my referral link, https://make.fun/r/z5073zsc
