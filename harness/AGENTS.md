# `harness/`: Visual Regression Harness

Playwright-driven baseline screenshots and the change-loop tooling for visual
work. This directory never moves through any migration.

---

## Purpose

The harness gives agents (and humans) visual feedback when changing UI code.
Every covered route has a committed baseline PNG. A re-run compares against the
baseline so any unintended pixel change is caught before a PR is opened.

---

## Commands

| Command | What it does |
|---|---|
| `npm run harness:baseline` | Boots Next dev, captures all routes, writes PNGs to `harness/baseline/`. Commit the results as the new baseline. |
| `npm run harness:check` | Boots Next dev, captures all routes, diffs against `harness/baseline/`. Two consecutive runs must produce identical hashes for a change to be considered stable. |

> ⚠️ Retained warning until Stage 4 lands: this directory is empty except for
> this tutor. The `harness:baseline` and `harness:check` scripts do not exist
> yet. They are added in Stage 4 (Migrations 4A through 4C). Do not reference
> these scripts in `package.json` or CI until Stage 4 is complete.

---

## Baseline convention

> ✅ Target convention: every route covered by the harness has a baseline PNG
> at `harness/baseline/<route>.png`. The `<route>` segment mirrors the URL path
> with slashes replaced by underscores. Example: `/rooms` becomes `rooms.png`,
> `/login` becomes `login.png`.

> ✅ Target convention: baselines are committed to the repository. A failing
> `harness:check` is a blocking signal, not a warning.

---

## Routes covered (target, after Stage 4 lands)

| Route | Baseline file |
|---|---|
| `/` | `baseline/index.png` |
| `/login` | `baseline/login.png` |
| `/rooms` | `baseline/rooms.png` |
| `/[id]/view` | `baseline/id_view.png` |
| `/[id]/ranking` | `baseline/id_ranking.png` |
| `/admin` | `baseline/admin.png` |

---

## Directory layout (target, after Stage 4 lands)

```
harness/
  AGENTS.md             (this file)
  CLAUDE.md             -> AGENTS.md
  playwright.config.ts  (Playwright config, baseURL: http://localhost:3000)
  boot.ts               (waits for Next dev on :3000 before capturing)
  screenshots.ts        (iterates routes, captures PNGs)
  baseline/             (committed PNGs, one per route)
```

---

## Change-loop workflow

1. Run `npm run harness:check` to capture the current state.
2. Make your UI change.
3. Run `npm run harness:check` again.
4. Inspect the diff PNGs. If the change is intentional, run
   `npm run harness:baseline` to promote the new screenshots.
5. Commit the updated baselines alongside the code change.
