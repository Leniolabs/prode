# PLAN.md: bringing hacker-prode to an agent-ready state

> **Status:** All stages complete. Migrations 3B–3L landed 2026-06-03. Pending human review gates before production deploy.
> **Branch:** `agent-ready`
> **Date:** 2026-05-28
> **Purpose:** the north star for transforming this codebase into one a capable agent can operate in. The plan executes in three stages (Tutor, Pin, Give it eyes), each gated by a human review. This document is the **only** thing the agent should treat as out-of-bounds to change without checkpointing back with the human.

---

## Current state

### Stack
- **Next.js 13** (pages router), React 18, SCSS modules
- **Prisma 4** → PostgreSQL
- **NextAuth** with OAuth (Google, Facebook, GitHub, Twitter)
- react-query, @napi-rs/canvas, fluent-ffmpeg (Instagram-story share assets)
- TypeScript `strict: true`, no test runner, no linter rules beyond `next/core-web-vitals`

### Domain
"Prode" is an Argentine sports prediction pool. A single global `Prode` holds the tournament; users join `ProdeRoom`s and predict match scores. Stages cover 8 groups (`GROUP_A..H`) plus a knockout bracket (`FINALS_8_*`, `FINALS_4_*`, `FINALS_2_*`, `FINAL`, `THIRD_PLACE`). Per-room scoring is configurable (`pointsWinner` / `pointsGoals` / `pointsPenal`). Rankings are computed with raw SQL window functions.

### How the system works today

**Request flow** (page render and write)

```
┌──────────┐  HTTP   ┌────────────────┐
│ browser  │ ──────► │  pages/*.tsx   │   server-rendered, getServerSideProps can call utils/queries
└──────────┘         └────┬───────────┘
                          │ fetch (client-side mutations)
                          ▼
                     ┌─────────────────┐
                     │ pages/api/*.ts  │   18 of 23 routes hand-roll the auth ladder
                     └────┬────────────┘   (getSession, getUserByEmail, getProdeRoom, ownership check)
                          │
                          ▼
                     ┌─────────────────┐
                     │ utils/queries.ts│   1017 lines, near-duplicate group/finals getters
                     └────┬────────────┘
                          │ prisma.*
                          ▼
                     ┌─────────────────┐
                     │    Postgres     │   ranking queries built in utils/raw.ts use $queryRawUnsafe
                     └─────────────────┘
```

**Domain model** (key Prisma entities)

```
┌──────────┐  1..*  ┌──────────┐  *..1  ┌──────────┐
│  Prode   │ ─────► │  Match   │ ─────► │ Country  │   (countryLeft / countryRight)
│ (one     │        │ (one row │        └──────────┘
│  global) │        │  per     │
└────┬─────┘        │  fixture)│
     │ 1..*         └──────────┘
     ▼
┌──────────┐  1..*  ┌─────────────┐
│ProdeRoom │ ─────► │  UserProde  │
│ (league) │        │ (one entry  │
└──────────┘        │  per user)  │
                    └──────┬──────┘
                           │ 1..*
                           ├─────────► ProdeUserGroupMatch    (group-stage guess)
                           │
                           └─────────► ProdeUserFinalsMatch   (knockout guess + predicted teams)
```

**Scoring path** (the duplication trap, visualized)

```
                ┌──────────────────────────┐
                │  Match (admin enters     │
                │  goals + penalties)      │
                └────────────┬─────────────┘
                             │
              ┌──────────────┴──────────────┐
              │                             │
              ▼                             ▼
   ┌──────────────────┐          ┌──────────────────────┐
   │ utils/points.ts  │          │   utils/raw.ts       │
   │ (TS, ~160 lines  │          │  (raw SQL CASE       │
   │  of nested ifs)  │          │   expressions)       │
   └────────┬─────────┘          └──────────┬───────────┘
            │                               │
            ▼                               ▼
    per-match badges                  leaderboard query
    (GOALS_MATCH /                    (sums across all
     WINNER_MATCH /                    matches per user)
     WRONG)
            │                               │
            ▼                               ▼
      user sees                         user sees
      "you nailed this match"           "you are 3rd in this room"

   ⚠ Two implementations of the same rules. Nothing verifies they agree.
```

### Confirmed traps

The session before this one walked the repo. Each entry is verified, with file refs.

| # | Trap | Where | Why it matters |
|---|---|---|---|
| 1 | **Scoring rules duplicated** in TS and SQL | `utils/points.ts` (`finalMatchPoints` ~160 lines of nested ifs) and `utils/raw.ts` (`getSubqueryFinals` / `getSubqueryGroups`) | TS drives per-match UI badges, SQL drives leaderboards. If one drifts the other silently disagrees. Single biggest hazard. |
| 2 | **Raw SQL via `$queryRawUnsafe`** with string interpolation | `utils/raw.ts`: `room.id`, stage names, joined directly into SQL strings | Values are DB-sourced cuids so practical injection risk is low, but it is the wrong pattern to have as a template in the codebase. |
| 3 | **Single-tournament assumption** | `prisma.prode.findFirst({})` repeated throughout `utils/queries.ts` (e.g. `:134`, `:148`, `:286`, `:405`) | Schema supports many `Prode` records; the app hard-codes "the only one". Reusing for a second tournament needs rework. |
| 4 | **Auth ladder copy-pasted** in 18 of 23 API routes | every file under `pages/api/` reimplements `getSession → 401 → getUserByEmail → 401 → getProdeRoom → 404 → ownership check` | One forgotten check is a hole; there is no single place to audit. |
| 5 | **Room-join passwords in plaintext** | `pages/api/[id]/checkpassword.ts:39` (`room.password !== password`) | Lower severity (OAuth handles real auth) but extends the wrong pattern if you build on it. |
| 6 | **Zero tests, no runner** | `package.json` has no jest/vitest; no test files anywhere | Combined with #1, a refactor cannot be safe. |
| 7 | **God-files and cross-page imports** | `Winners.tsx` 1849, `queries.ts` 1017, `finals.tsx` 919; `pages/[id]/view.tsx:46` imports from `../finals` | Page modules are not cleanly separable. |
| 8 | **Type-safety escapes** | 19 `as any` / `@ts-ignore` in source despite `strict: true`; `lib/prisma.ts` uses `// @ts-ignore` for the dev-reload global | Most are harmless, but the leaky places need to be named so the agent does not propagate them. |
| 9 | **Cruft at the root** | `502.html` (487 KB Heroku error page), `setup.sh` (a patchelf hack for `canvas`'s zlib on the host) | Confuses tools and contributors; both can be deleted or moved. |

### What is actually well-built (and must stay)
- **Component taxonomy**: `components/{common,layout,view}` is a real, sensible split. Every component is `Name.tsx + Name.module.scss + index.ts` barrel, applied uniformly. This convention is the strongest thing in the repo and any new code must follow it.
- **Prisma client singleton** (`lib/prisma.ts`) correctly guards dev hot-reload connection leaks.
- **TypeScript strict mode** is on; the data layer uses precise `Pick<...>` types instead of `any` blobs.
- **i18n** is present via `locale/` and `useLocalizedText`, not common in weekend builds.

---

## Goal / north star

The codebase becomes one a capable agent can **operate** in, on a modern stack:
- it knows how to run, build, test, verify, without guessing
- it knows the landmines before it steps on them
- it can change code with a safety net (tests)
- it can see what it produces (a screenshot harness)
- it runs on a current, supported foundation (Next.js 16 App Router, React 19, Prisma 7, Auth.js 5, Tailwind 4, TanStack Query 5, Vitest 4, TypeScript 5)

Concretely, the work is four stages, executed in order: **Pin → Tutor → Migrate → Give it eyes**, all driven by this plan. Stage 3 carries the bulk of the work, including the full reorganization into `src/` and the stack modernization.

---

## Target structure

The end state every migration aims at. This section is the contract: every tutor describes the slice of it under its directory, every migration moves the code one step closer.

### Target stack

| Layer | Choice | Replaces |
|---|---|---|
| Framework | **Next.js 16** with **App Router** | Next.js 13 Pages Router |
| UI runtime | **React 19** | React 18 |
| ORM | **Prisma 7** with `@prisma/adapter-pg`, generated client at `src/generated/prisma/` | Prisma 4 default client |
| Auth | **Auth.js 5** (`next-auth@5`) with `@auth/prisma-adapter@2` | `next-auth@4` with `@next-auth/prisma-adapter@1` |
| Styling | **Tailwind CSS 4** (`@tailwindcss/postcss`) | Sass + SCSS modules |
| UI primitives | **Radix UI** + **react-aria-components** | Hand-rolled (Modal, Dropdown, etc.) |
| Data layer | **`@tanstack/react-query@5`** | `react-query@3` |
| Tests | **Vitest 4** + `@vitest/coverage-v8` + `vite-tsconfig-paths` | none |
| TypeScript | **5.x** | 4.8 |
| Lint | **ESLint 9** flat config (`eslint.config.js`) | ESLint 8 `.eslintrc` |
| Scripts | **`tsx`** | `ts-node` |
| Visual harness | **Playwright** | none |

### Target tree

```
prode/
├── AGENTS.md            (canonical; CLAUDE.md is a symlink to it)
├── CLAUDE.md            → AGENTS.md
├── PLAN.md
├── README.md
├── package.json
├── tsconfig.json        (paths: "@/*": ["./src/*"], "@test/*": ["./tests/*"])
├── next.config.ts
├── tailwind.config.ts
├── postcss.config.js
├── eslint.config.js     (flat config)
├── vitest.config.ts
├── playwright.config.ts
├── docker-compose.yml   (Postgres for dev + Phase 1C)
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed/
│       ├── index.ts             (orchestrator, callable via npm run seed)
│       ├── countries.ts         (48 Country rows for WC 2026)
│       ├── fixture.ts           (72 group-stage Match rows)
│       └── bracket.ts           (R32 + R16 + QF + SF + F scaffolding)
├── public/
│   └── flags/                   (+ 22 new PNGs for WC 2026; CountryFlag falls back to default.png)
├── harness/                     (Stage 4, never moves)
│   ├── AGENTS.md  →  CLAUDE.md
│   ├── boot.ts                  (waits for Next dev on :3000)
│   ├── screenshots.ts           (capture routes)
│   └── baseline/                (committed PNGs)
├── tests/                       (Stage 1+ home, never moves)
│   ├── AGENTS.md  →  CLAUDE.md
│   ├── scoring.test.ts          (Phase 1B)
│   ├── fixtures/
│   │   ├── scoring.ts           (golden-master cases)
│   │   └── matches.ts           (Match-shape factories)
│   └── sql/
│       ├── divergence.test.ts   (Phase 1C)
│       └── divergence-report.md (Phase 1C output)
└── src/
    ├── AGENTS.md  →  CLAUDE.md
    ├── app/                                          (App Router root)
    │   ├── layout.tsx
    │   ├── page.tsx                                  (was pages/index.tsx)
    │   ├── globals.css                               (Tailwind base)
    │   ├── (auth)/
    │   │   ├── login/page.tsx
    │   │   └── blocked/page.tsx
    │   ├── (room)/[id]/
    │   │   ├── view/page.tsx
    │   │   ├── groups/page.tsx
    │   │   ├── finals/page.tsx
    │   │   ├── ranking/page.tsx
    │   │   ├── results/page.tsx
    │   │   └── checkpassword/page.tsx
    │   ├── admin/
    │   │   ├── page.tsx
    │   │   ├── finals/page.tsx
    │   │   └── groups/page.tsx
    │   ├── new-prode/page.tsx
    │   ├── rooms/page.tsx
    │   ├── finals/page.tsx
    │   ├── groups/page.tsx
    │   ├── maintenance/page.tsx
    │   └── api/                                      (App Router route handlers)
    │       ├── AGENTS.md  →  CLAUDE.md
    │       ├── auth/[...nextauth]/route.ts           (Auth.js 5)
    │       ├── countries/route.ts
    │       ├── create/route.ts
    │       ├── profile/route.ts
    │       ├── groups/route.ts
    │       ├── finals/route.ts
    │       ├── check-room-name/route.ts
    │       ├── [id]/
    │       │   ├── update/route.ts
    │       │   ├── delete/route.ts
    │       │   ├── leave/route.ts
    │       │   ├── groups/route.ts
    │       │   ├── finals/route.ts
    │       │   ├── checkpassword/route.ts
    │       │   ├── video/route.ts
    │       │   ├── story-image/route.ts
    │       │   └── story-video/route.ts
    │       └── admin/
    │           ├── reset/route.ts
    │           ├── prune/route.ts
    │           ├── finals/route.ts
    │           ├── groups/route.ts
    │           ├── finals-start/route.ts
    │           ├── rooms/[id]/delete/route.ts
    │           └── users/[id]/block/route.ts
    ├── components/                                   (feature components)
    │   ├── AGENTS.md  →  CLAUDE.md
    │   ├── common/                                   (BrandLogo, Button, Form, ...)
    │   └── view/                                     (Finals/, Groups/, Index/, ShareVideo/, Winners/)
    ├── layout/                                       (page primitives, was components/layout/)
    │   ├── Card/
    │   ├── Container/
    │   ├── Header/
    │   ├── Layout/
    │   └── Footer/
    ├── hooks/
    ├── lib/                                          (engine: cross-cutting domain logic)
    │   ├── AGENTS.md  →  CLAUDE.md
    │   ├── prisma.ts                                 (uses @prisma/adapter-pg)
    │   ├── auth/                                     (Migration D + K)
    │   │   ├── auth.config.ts                        (Auth.js 5 providers + callbacks)
    │   │   ├── withAuth.ts                           (route-handler wrapper)
    │   │   ├── ownership.ts                          (room / admin checks)
    │   │   ├── passwords.ts                          (hash + compare, Migration K)
    │   │   └── types.ts                              (augmented session / user types)
    │   └── scoring/                                  (Migration I, single source of truth)
    │       ├── index.ts                              (public API)
    │       ├── group.ts                              (group-stage points)
    │       ├── finals.ts                             (knockout, penalty branches)
    │       └── types.ts                              (Match / UserMatch / Room shapes)
    ├── generated/
    │   └── prisma/                                   (generator output target, Prisma 7)
    ├── config/                                       (settings.ts, env wiring)
    ├── types/                                        (ambient types, Auth.js session shape)
    ├── styles/
    │   └── globals.css                               (Tailwind directives)
    ├── locale/
    └── utils/
        ├── AGENTS.md  →  CLAUDE.md
        ├── points.ts                                 (post-Migration I: shim re-exporting @/lib/scoring)
        ├── raw.ts                                    (post-Migration J: parameterized $queryRaw)
        ├── queries.ts                                (1017 lines; split deferred)
        └── ...                                       (array, classname, date, share, ...)
```

### Why this shape

- **Top-level stays small.** `tests/`, `harness/`, `prisma/`, `public/`, and configs at the root. Tests and harness never move, so test imports and screenshot paths are stable across every migration.
- **Everything else is under `src/`.** The mental model is: `src/app/` is the UI / routes, `src/lib/` is the engine (cross-cutting domain logic, no React), `src/utils/` is the small-helpers junk drawer, `src/components/` is feature UI, `src/layout/` is shell primitives.
- **`lib/auth/` and `lib/scoring/` are the two new engine modules.** Both are owned by specific migrations (D and I respectively). The tutors for them describe the shape; the migrations land them.
- **Generated Prisma client lives at `src/generated/prisma/`** (configured in `schema.prisma`'s `generator client { output = ... }`), so the import path is stable and the output is reproducible.
- **Path aliases unify everything.** `@/lib/scoring`, `@/lib/auth/withAuth`, `@/utils/raw`, `@/components/Chat/...`, etc., are how production code and tests import. The aliases are the stable contract; the file locations underneath can change without rewriting imports.

---

## Stage 1 · Pin · characterization tests

Lock the behavior of the risky core before any code moves. The tests are the safety net for every migration that follows, and **the test layout is designed so the tests themselves survive every migration without rewrites**.

### Choices
- **Runner:** Vitest 4 with `@vitest/coverage-v8`.
- **Stable test home:** all tests live in `tests/` at the repo root. This directory is **never moved** by any migration. The `src/` reorganization, the App Router migration, the Prisma upgrade, none of them touch `tests/`.
- **Path aliases** (`@/*`) are configured in `tsconfig.json` from Phase 1A. Tests import via `@/lib/scoring`, `@/lib/auth`, etc. As code moves between migrations, only the alias target changes (e.g. `./utils/*` → `./src/utils/*`); test imports stay identical.
- **Vite tsconfig paths plugin** (`vite-tsconfig-paths`) wires the aliases into Vitest so tests resolve correctly through every reshape.
- **Fixtures** live in `tests/fixtures/` (also never moves).
- **First target:** the scoring engine. Pure, branchy, duplicated. Highest value.
- **Approach:** golden-master tables. A list of `(match, userMatch, room)` tuples mapped to expected points or status. The point is to **pin current behavior even where it looks buggy**, so any refactor cannot silently change rankings.
- **Coverage target:** ≥ 90% line coverage on the scoring code and on the SQL produced by `utils/raw.ts`.

### Phase 1A · Vitest setup
- Add `vitest@^4`, `@vitest/coverage-v8@^4`, `vite-tsconfig-paths@^6` as devDependencies.
- Update `tsconfig.json` `compilerOptions.paths`:
  - `"@/*": ["./*"]` initially (root-relative). Updated to `["./src/*"]` after the `src/` migration.
- Add `vitest.config.ts`:
  ```ts
  import { defineConfig } from 'vitest/config'
  import tsconfigPaths from 'vite-tsconfig-paths'

  export default defineConfig({
    plugins: [tsconfigPaths()],
    test: {
      environment: 'node',
      globals: true,
      include: ['tests/**/*.test.ts'],
      coverage: {
        provider: 'v8',
        reporter: ['text', 'html'],
        include: ['utils/points.ts', 'utils/raw.ts', 'lib/**/*.ts', 'src/lib/**/*.ts'],
        exclude: ['**/*.d.ts', '**/*.test.ts'],
        thresholds: { lines: 90, functions: 90, branches: 85, statements: 90 },
      },
    },
  })
  ```
- `package.json` scripts:
  - `"test": "vitest run"`
  - `"test:watch": "vitest"`
  - `"test:coverage": "vitest run --coverage"`
- Create `tests/` and `tests/fixtures/` (empty placeholders ok).
- **Done when:** `npm test` runs and reports zero tests cleanly. `npm run test:coverage` runs and reports.

### Phase 1B · Characterize the scoring engine
Tests live at `tests/scoring.test.ts`. Fixtures live at `tests/fixtures/scoring.ts`.

Note on where scoring lives: the **status helpers** (`matchResultStatus`, `matchFinalResultStatus`, `matchCountriesMatchStatus`) and the **winner / looser helpers** (`getAdminMatchWinner`, `getFinalsMatchWinner`, etc.) live in `utils/points.ts`. The **point arithmetic** (`finalMatchPoints`, `computeFinalMatchPoints`, `computeGroupMatchPoints`) lives in `utils/queries.ts`. Phase 1B characterizes both. The plain `utils/points.ts` and `utils/raw.ts` are exported as-is; the three arithmetic functions in `utils/queries.ts` get the `export` keyword added (a one-line surgical change so tests can import them).

Imports use aliases that survive the migration:
```ts
import { matchResultStatus, matchFinalResultStatus, ... } from '@/utils/points'
import { finalMatchPoints, computeFinalMatchPoints, computeGroupMatchPoints } from '@/utils/queries'
// after Migration I, the aliases still resolve; only their targets change.
```

Targets in risk order:
1. `finalMatchPoints` (the big SQL-mirror function with penalty-shootout branches, in `utils/queries.ts`)
2. `matchResultStatus`, `matchFinalResultStatus`, `matchCountriesMatchStatus` (in `utils/points.ts`)
3. `getAdminMatchWinner`, `getFinalsMatchWinner`, `getFinalsMatchLooser`, `getAdminFinalsMatchWinner`, `getAdminFinalsMatchLooser` (in `utils/points.ts`)
4. `computeGroupMatchPoints`, `computeFinalMatchPoints` (in `utils/queries.ts`)

Fixture file shape (typed, TypeScript object exports):
```ts
// tests/fixtures/scoring.ts
export const FINALS_SCORING = [
  { name: 'exact score with penalties', input: { /* ... */ }, expected: 5 },
  { name: 'winner correct goals exact', input: { /* ... */ }, expected: 3 },
  // multiple feature-driven scenarios per category
] as const
```

Tests use `describe` per feature category and `it.each` over the fixture array. Each row reads as a user-facing scenario, not a code branch, so the test contract survives the unification in Migration I because it does not depend on internal shape.

Build cases covering: regulation wins, draws, penalty shootouts, missing predictions, missing real results, country-mismatch cases.

- **Done when:** every status function and the three arithmetic functions have ≥ 20 fixture rows (or full feature coverage if fewer suffice), all green, ≥ 90% line coverage on `utils/points.ts` and on the scoring slice of `utils/queries.ts`.

### Phase 1C · Characterize the SQL scorer
Tests live at `tests/sql/divergence.test.ts`. Reuse the `FINALS_SCORING` and `GROUP_MATCH_SCORING` arrays from `tests/fixtures/scoring.ts`.

- **Test DB strategy:** add a sibling `prode-test-db` service to `docker-compose.yml` exposed on host port `5433` (the existing dev service stays on `5432`). Database name `prode_test`, same credentials as dev. Two `npm` scripts wire this together: `npm run test:db:up` boots the container and runs `prisma db push`, and `npm run test:db:reset` removes the container and re-creates a clean DB. Keeping a separate service means `npm test` never fights the dev DB for state.
- Seed each fixture row into the test DB (`Country`, `Prode`, `ProdeRoom`, `UserProde`, `Match`, `ProdeUserFinalsMatch`).
- Run the SQL produced by `getSubqueryFinals` / `getSubqueryGroups` via `$queryRawUnsafe`.
- Compare totals to the TS-side `finalMatchPoints` for the same fixtures.
- **Expect divergence.** Any row where TS and SQL disagree is a real bug; log it as a row in `tests/sql/divergence-report.md` (Markdown table: `# | fixture | TS | SQL | Δ | hypothesis`). Do not "fix" it yet. Migration I owns that.

- **Done when:** a side-by-side report at `tests/sql/divergence-report.md` exists. Every fixture row is either matched or triaged with a hypothesis. The report goes into the human review gate.

### Phase 1D · Characterize the multi-step DB writes in `utils/queries.ts`

`utils/queries.ts` also contains side-effect-heavy functions that the API routes call and that several later migrations (C: Prisma 7, F: Next 16 / async APIs, G: App Router data-fetching) will touch. Those functions are characterized here so the same kind of silent regressions caught in Phase 1B/1C are caught for the write path too.

Scope (the high-risk multi-step writes; thin Prisma wrappers stay untested and rely on TypeScript types):

- `registerUserToRoom(room, user)`: creates a `UserProde` and copies template predictions over with date and completeness filters.
- `syncronizeTemplate(room, user)`: diffs the user's room predictions against their template `UserProde` and creates/updates rows.
- `syncronizeFinalsTemplate(room, user)`: same shape for finals matches, scoped to matches that already have countries set.
- `deleteUserProde(userProdeId)`: clean-up across `ProdeUserGroupMatch`, `ProdeUserFinalsMatch`, `UserProde` in dependency order.

Tests live in three sibling files for parallel-subagent dispatch:
- `tests/queries-register.test.ts` + `tests/fixtures/queries-register.ts`
- `tests/queries-sync.test.ts` + `tests/fixtures/queries-sync.ts`
- `tests/queries-delete.test.ts` + `tests/fixtures/queries-delete.ts`

Each test file:
- Connects to the same `prode-test-db` from Phase 1C.
- Uses scoped factory helpers + a `cleanDB(prisma)` that truncates in dependency order so tests are isolated.
- Uses `describe` per function and `it` per feature scenario (roughly 4 to 8 scenarios per function).
- Asserts observable DB state (`prisma.<table>.count()` and `findFirst`) plus return value. No internal-shape assertions.

Test isolation: DB-touching test files cannot run in parallel with each other (the cleanup of one file races the seed of another). `vitest.config.ts` sets `test.fileParallelism: false`. The cost on the pure-TS scoring file is ~1s; the determinism is worth it.

- **Done when:** every function in scope has ≥ 4 feature-driven scenarios, all green, and the full `npm test` reports `0 failed` against the test DB.

### Gate after Stage 1
Human reviews: the golden-master fixtures for realism, the coverage report, the TS-vs-SQL divergence report, and the write-path scenarios (especially anything marked `pinned current behavior, may be a bug:` so it can be triaged into "intended" or "must fix in Migration I or later"). The gate is also where the "9. Coverage gap" question gets answered: the thin Prisma getters in `utils/queries.ts` and the small helpers in `utils/*` (array, classname, date, etc.) are intentionally not characterized; TypeScript types and Stage 4 visual regression are the safety net for them.

---

## Stage 2 · Tutor · seed the target structure

**The shift:** these `AGENTS.md` files describe the **target** state, not the current code. They are the contract the migration moves toward. A tutor here answers "what will this folder look like once the migration lands, and what conventions must any new code follow?"

**Rule:** every nested tutor encodes **target conventions** first, with **retained warnings** for traps that survive until their migration lands. "This is the utils folder" filler is forbidden.

**Convention:** `AGENTS.md` is canonical; `CLAUDE.md` is a symlink to it, so every agent reads one source of truth.
```
ln -s AGENTS.md CLAUDE.md
```

### `/AGENTS.md` (root)
1. **How to run / build / test / verify** (`npm install`, `npm run dev`, `npm run build`, `npm test`, `npm run test:coverage`, `npm run harness:check`).
2. **Architecture in one paragraph** (Next 16 App Router, Prisma 7 with adapter-pg, Auth.js 5, Tailwind 4, one global `Prode`).
3. **Landmines that survive until their migration lands** (the trap table above, abbreviated, with each landmine pinned to the migration that retires it).
4. **Layered model** (`src/app/` = UI + routes, `src/lib/` = engine, `src/utils/` = small helpers, `src/components/` = feature UI, `src/layout/` = shell primitives).
5. **Path-alias contract** (`@/*` → `src/*`, `@test/*` → `tests/*`).
6. **Non-goals** (no feature work beyond WC 2026, no multi-tournament, no auth provider swap, no ORM swap).

### `/src/AGENTS.md`
- **Layered rule:** UI imports lib, lib does not import UI. `lib/` never imports React. `utils/` never imports React.
- **Imports go via aliases.** Relative paths only inside a single sub-module.
- **One responsibility per directory.** New cross-cutting domain logic goes in `lib/`. New small helpers in `utils/`. New shell primitives in `layout/`. New feature components in `components/`.

### `/src/lib/AGENTS.md`
- **Target convention:** every module under `lib/` exposes its public API through `index.ts`. Internals stay private to the directory.
- **Target convention:** no React inside `lib/`. Pure TypeScript and Prisma calls only.
- **`lib/prisma.ts`** uses `@prisma/adapter-pg` and imports the generated client from `@/generated/prisma`. The dev hot-reload singleton guard stays.
- **`lib/auth/`** exposes `auth.config.ts`, `withAuth`, and `ownership`. Route handlers consume `withAuth`; nothing else implements an auth ladder by hand.
- **`lib/scoring/`** is the only place scoring lives. The TS implementation is the source of truth; `src/utils/points.ts` is a re-export shim after Migration I.

### `/src/components/AGENTS.md`
- **Target convention:** every component is `Name.tsx + index.ts` barrel. The companion `Name.module.scss` is gone after Migration H; styling is Tailwind classes inline.
- **Target convention:** `common/` is generic widgets, `view/` is page-specific. (Shell primitives live in `src/layout/`, not here.)
- **Target convention:** modal, dropdown, tooltip, select, and switch primitives come from Radix; do not roll a new one.
- **Target convention** (Migration L): bracket components read the `Stage` enum dynamically, not hardcoded to a fixed tournament shape.

### `/src/utils/AGENTS.md`
- **What lives here:** small, dependency-free pure functions (array, classname, date, share, images, email helpers).
- **What does NOT live here:** cross-cutting domain logic (move to `lib/`). React (move to a hook or component).
- **Retained warning until Migration I lands:** scoring is duplicated in `points.ts` and `raw.ts`. Any change must update both AND keep the Stage 1 tests green.
- **Retained warning until Migration J lands:** `raw.ts` uses `$queryRawUnsafe` with string-interpolated values. New queries must use parameterized `$queryRaw` template literals; the existing ones get migrated.

### `/src/app/api/AGENTS.md`
- **Target convention:** every route handler uses `withAuth(handler, { ownership?: 'room' | 'admin' })` from `@/lib/auth/withAuth`. The hand-rolled auth ladder is gone after Migration D.
- **Target convention:** route file is `route.ts`, exports `GET`, `POST`, `PUT`, `DELETE`, etc., as required.
- **Target convention:** response shapes are `{ id }` on success; failure is a bare status code with `{}` body.
- **Retained warning until Migration K lands:** `checkpassword/route.ts` stores and compares passwords in plaintext. Do not extend that pattern; any new password field is hashed from day one via `@/lib/auth/passwords`.

### `/harness/AGENTS.md`
- **What this directory is for:** Playwright-driven baseline screenshots and the change-loop tooling for visual work.
- **Convention:** every route covered by the harness has a baseline PNG under `harness/baseline/<route>.png`. Run `npm run harness:baseline` to regenerate.
- **Convention:** `npm run harness:check` is the loop the agent uses to verify a visual change. Two consecutive runs must produce identical hashes.

### `/tests/AGENTS.md`
- **What this directory is for:** all characterization, unit, and SQL integration tests. This directory **never moves** through any migration.
- **Path aliases:** import via `@/lib/*`, `@/utils/*`, etc. Never use relative paths into `src/`.
- **Fixture convention:** golden-master data lives under `tests/fixtures/` as typed TypeScript object exports.
- **SQL tests:** in `tests/sql/`; spin Postgres via Docker compose, seed fixtures, compare TS vs SQL via the divergence report at `tests/sql/divergence-report.md`.

### Gate after Stage 2
Human reviews the four AGENTS.md files. The question is "is this the target we want to migrate toward?", not "does this describe the code today." Once accepted, the symlinks are created and committed alongside the docs. The migrations now have a written contract.

---

## Stage 3 · Migrate · converge on the tutors

Each migration moves a slice of the code toward the target structure and target stack. Stage 1 tests stay green throughout; the path aliases mean test imports never change as the underlying files move. Order matters: pre-reqs are listed per migration. Each migration ships behind its own PR.

The migrations are ordered as **foundation → upgrade → domain**:
- A through B set the layout and tooling foundation.
- C through H upgrade the stack (DB, auth, data layer, framework, routing, styles).
- I through L do the domain cleanup and the WC 2026 work on the modernized foundation.

---

### Migration A · Move into `src/`
Reorganize the working tree into the target structure.

**Sub-steps**
1. Create `src/` and `git mv` directories in:
   - `components/` → `src/components/`
   - `components/layout/` → `src/layout/` (promoted to top-level)
   - `hooks/`, `lib/`, `locale/`, `pages/`, `styles/`, `utils/` → `src/<name>/`
2. Create empty scaffolding for `src/types/`, `src/config/`, `src/generated/` (populated by later migrations).
3. Move `settings.ts` into `src/config/`.
4. Update `tsconfig.json`:
   - `compilerOptions.paths` → `"@/*": ["./src/*"]`, `"@test/*": ["./tests/*"]`.
   - `include` adjusted for `src/**/*`.
5. Update `next.config.js` if any explicit page or include paths are set.
6. Update relative imports that can't be expressed via aliases (rare; most imports already need rewriting only at the alias level).
7. No code changes beyond import paths. The app behavior is byte-identical.

**Pre-reqs:** Stage 1 green (so the test suite proves nothing broke).
**Done when:** `npm run dev` boots, `npm run build` passes, all Stage 1 tests green.

---

### Migration B · Foundation tooling
Bring the toolchain up to current.

**Sub-steps**
1. TypeScript 4.8 → 5.x (`typescript@^5`, `@types/node@^20`, `@types/react@^19`, `@types/react-dom@^19`).
2. ESLint 8 → 9 with flat config: create `eslint.config.js`, remove `.eslintrc*`, install `eslint@^9` and `eslint-config-next` aligned with target Next version.
3. Add `tsx@^4` for executing TS scripts (replaces `ts-node` where applicable).
4. `package.json` script audit:
   - Prisma `seed` runner switches to `tsx`.
   - Add `lint`, `lint:fix`.
5. Address any TS5 / ESLint 9 warnings that surface, file-by-file.

**Pre-reqs:** Migration A done.
**Done when:** `npm run lint` is clean, `npm run build` passes, `npm test` green.

---

### Migration C · Database (Prisma 4 → 7)
Move to Prisma 7, the pg adapter, and the generated client at `src/generated/prisma/`.

**Sub-steps**
1. Install `prisma@^7`, `@prisma/client@^7`, `@prisma/adapter-pg@^7`, `pg@^8`.
2. Update `schema.prisma`:
   - `generator client { output = "../src/generated/prisma" }` (so the client lives inside `src/`).
   - Adjust any field types or attributes Prisma 7 deprecates.
3. Run `npx prisma generate`.
4. Update `src/lib/prisma.ts`:
   - Import the generated client from `@/generated/prisma`.
   - Use `@prisma/adapter-pg` to wrap a `pg.Pool`.
   - Keep the dev hot-reload singleton guard.
5. Update every import that referenced `@prisma/client` to `@/generated/prisma`.
6. Split `prisma/seed.ts` into `prisma/seed/{index,countries,fixture,bracket}.ts` (the per-concern layout that Migration L populates with WC 2026 data).
7. Verify the existing `prisma/migrations/*` apply cleanly against Prisma 7.

**Pre-reqs:** Migration B done.
**Done when:** `npx prisma migrate dev` succeeds, the dev app boots and reads data, Stage 1 tests green.

---

### Migration D · Auth (NextAuth 4 → Auth.js 5 + `withAuth` middleware)
The most data-sensitive migration. Lays the `lib/auth/` module, extracts the route wrapper, and migrates the existing auth tables safely.

**The auth table migration is the critical part of this step.** Existing `User`, `Account`, `Session`, and `VerificationToken` rows are production data tied to real OAuth identities. Losing or corrupting them locks every user out.

**Current vs target schema**

| Table | Current (`@next-auth/prisma-adapter@1`) | Target (`@auth/prisma-adapter@2`) | Action |
|---|---|---|---|
| `User` | `id, name?, email?, emailVerified?, image?` + app fields (`blocked`, `prodePublic`, `background`, `dark`) + relations | Same core fields. Auth.js 5 also accepts arbitrary extra columns. | **Preserve all rows.** App columns stay untouched. |
| `Account` | `id, userId, type, provider, providerAccountId, refresh_token?, access_token?, expires_at?, token_type?, scope?, id_token?, session_state?` with `@@unique([provider, providerAccountId])` | Same shape. Auth.js 5 also tolerates the OAuth1 columns (`oauth_token`, `oauth_token_secret`) for legacy Twitter; not needed for our Twitter v2.0 provider. | **Preserve all rows.** Identities stay linked. |
| `Session` | `id, sessionToken, userId, expires` | Same shape, **but the cookie format and signing differ between v4 and Auth.js 5.** | **Truncate on cutover.** Old session cookies become invalid; users sign in again via OAuth (their `Account` row already exists, so they land on the same `User.id`). |
| `VerificationToken` | `identifier, token, expires` with `@@unique([identifier, token])` | Same shape. | **Truncate on cutover.** Pending email verifications restart. Low impact (we only use OAuth providers). |

**Sub-steps**
1. **Schema audit.** Diff the current `schema.prisma` against the Auth.js 5 adapter expected fields. Any field-name or type mismatch is logged before any code change.
2. **No destructive schema change.** Add any missing columns Auth.js 5 needs (a Prisma migration), but never `DROP` or `RENAME` an existing column.
3. **Package swap.** Remove `next-auth@^4` and `@next-auth/prisma-adapter@^1`. Install `next-auth@^5` (beta line is acceptable, pinned) and `@auth/prisma-adapter@^2`.
4. **Build `src/lib/auth/auth.config.ts`.** The Auth.js 5 configuration: providers (Google, Facebook, GitHub, Twitter), adapter (`PrismaAdapter(prisma)`), session strategy (database), callbacks (`session`, `signIn` to enforce `User.blocked`), and pages override (`signIn: '/'`).
5. **Build the auth handlers.** `src/app/api/auth/[...nextauth]/route.ts` exports `GET` and `POST` from the Auth.js 5 `NextAuth(authConfig)` factory.
6. **Build `src/lib/auth/withAuth.ts`.** A route-handler wrapper used by every API route:
   ```ts
   withAuth(async (req, { session, user, room }) => { /* handler */ }, { ownership?: 'room' | 'admin' })
   ```
   Internally: calls `auth()` from the Auth.js 5 helper, returns `401` on no session, fetches `User` by email and returns `401` if blocked, optionally resolves `ProdeRoom` by `req.params.id` and returns `404` if not found or `403` if `room.userId !== user.id`.
7. **Build `src/lib/auth/ownership.ts`** for the room and admin checks (kept separate so they're testable in isolation).
8. **Build `src/lib/auth/types.ts`.** Augments the Auth.js `Session` type with the app's `User` shape.
9. **Migrate the 18 API routes.** One PR per ~5 routes:
   - Replace hand-rolled `getSession({ req }) → 401 → getUserByEmail → 401 → getProdeRoom → 404 → ownership check` with `export const POST = withAuth(handler, { ownership: 'room' })`.
   - Route responses stay `{ id }` on success and bare status codes on failure (existing contract).
10. **Cutover plan for production data.**
    - Truncate `Session` and `VerificationToken` rows in a single transaction at deploy time. Users will sign in again via their existing OAuth account; their `User.id` and `Account` row stay untouched.
    - Pre-deploy: prepare a rollback path (keep `next-auth@4` code on a fallback branch in case the beta proves unstable).
    - Post-deploy: smoke-test sign-in for each of the four providers in production with throwaway accounts before announcing.
11. **Update session consumers.** Any `useSession` calls in components stay (Auth.js 5 `next-auth/react` still exports it), but the shape may need a small typing adjustment.

**Pre-reqs:** Migration C done (Prisma 7 client and adapter-pg already in place).
**Done when:** all four OAuth providers complete login → user lands on their `Prode` data; every API route works via `withAuth`; the auth ladder is gone from every `route.ts`; Stage 1 tests green.

**Fallback:** if Auth.js 5 beta proves unstable in production smoke tests, the same `withAuth` shape can be implemented against `next-auth@4`. Code in `lib/auth/` insulates the rest of the app from the choice.

---

### Migration E · Data layer (react-query 3 → `@tanstack/react-query@5`)

**Sub-steps**
1. Remove `react-query@^3`. Install `@tanstack/react-query@^5` and `@tanstack/react-query-devtools@^5`.
2. Set up the `QueryClient` and `QueryClientProvider` in `src/app/layout.tsx`.
3. Rewrite every consumer: `useQuery(['key'], fn)` → `useQuery({ queryKey: ['key'], queryFn: fn })`. Same for `useMutation`.
4. Update fetch wrappers in `src/utils/api.ts` and any `hooks/use*` data hook.

**Pre-reqs:** Migration A done.
**Done when:** every data-fetching screen still works in dev; Stage 1 tests green; Stage 4 baselines unchanged.

---

### Migration F · Framework (Next 13 → 16)
Bump the framework, fix breaking changes, stay on the Pages Router for now (the Router migration is Migration G).

**Sub-steps**
1. `next@^16`, `eslint-config-next@^16`, `react@^19`, `react-dom@^19`.
2. Address Next 15+ breaking changes: async request APIs (`headers()`, `cookies()`, `params`, `searchParams` are now Promises in server contexts), caching defaults, image component changes.
3. Address React 19 breaking changes: `ref` as prop (no more `forwardRef` boilerplate), `useState` batching, removal of legacy `propTypes`.
4. Verify SCSS modules still build (Next 16 supports them; Tailwind comes in Migration H).

**Pre-reqs:** Migration D done (Auth.js 5 is the Next-16-compatible auth path).
**Done when:** `npm run dev` boots, every page renders, every API route returns expected shapes, Stage 1 tests green.

---

### Migration G · Routing (Pages Router → App Router)
Migrate the routes page-by-page into `src/app/`. The route handlers (`src/app/api/.../route.ts`) were already created in Migration D; this migration completes the UI side.

**Sub-steps**
1. Create `src/app/layout.tsx` (root layout with `<html>`, `<body>`, providers from Migration E).
2. Create route groups: `src/app/(auth)/`, `src/app/(room)/`.
3. For each existing `pages/*.tsx` route, convert to `src/app/.../page.tsx`:
   - Default to **server component**; mark `'use client'` only when the page uses hooks or browser APIs.
   - Replace `getServerSideProps` with direct `await prisma.*` calls in the server component.
   - Replace `useRouter` from `next/router` with `useRouter` from `next/navigation` (different API).
   - Move `<Meta>` content to a per-route `generateMetadata` export.
4. Delete `pages/_app.tsx`; its concerns split between `src/app/layout.tsx` (providers, global CSS) and route groups (auth-gated layouts).
5. Add `src/app/api/auth/[...nextauth]/route.ts` (already from Migration D).
6. Stage 4 harness baselines should be regenerated after each batch of routes to catch any visual drift.

**Pre-reqs:** Migration F done.
**Done when:** every route accessible at its previous URL, no `pages/` directory remains, Stage 1 tests green.

---

### Migration H · Styling (SCSS → Tailwind 4 + Radix primitives)
The visual rewrite.

**Sub-steps**
1. Install `tailwindcss@^4`, `@tailwindcss/postcss`. Add `tailwind.config.ts`, `postcss.config.js`.
2. Create `src/styles/globals.css` with Tailwind directives; import from `src/app/layout.tsx`.
3. Convert each component: delete `Name.module.scss`, replace `styles.X` references with Tailwind class strings in `Name.tsx`.
4. Replace hand-rolled primitives where Radix is a clear win:
   - `Modal` → `@radix-ui/react-dialog`
   - `PasswordModal` → `@radix-ui/react-dialog`
   - `HeaderMenu`, `MobileHeaderMenu` → `@radix-ui/react-dropdown-menu`
   - `CountrySelect`, `LocaleSelect` → `@radix-ui/react-select`
   - `Toggle` → `@radix-ui/react-switch`
   - `Warning` / tooltips → `@radix-ui/react-tooltip`
5. Remove `sass` from `package.json`.
6. Rebrand work (color tokens, typography, spacing) lives here. Stage 4 harness baselines are updated to reflect the new design as the final step.

**Pre-reqs:** Migration G done.
**Done when:** no `*.module.scss` files remain, `sass` removed, app renders intentionally, Stage 4 harness has updated baselines.

---

### Migration I · Unify the scoring engine
Build `src/lib/scoring/` as the single source of truth and retire the duplicated implementations.

Two candidate strategies, picked after Phase 1C's divergence report:
- **I1:** TS as source of truth. The leaderboard query stops computing points in SQL; it sums precomputed `points` columns written at match-result time.
- **I2:** SQL as source of truth. The TS side becomes a thin wrapper that calls a DB function.

I1 is preferred (logic lives in code, not SQL), but I2 is simpler if write-time hooks are intrusive. Decision deferred to a human at the gate after Stage 1 lands.

**Sub-steps**
1. Create `src/lib/scoring/{index,group,finals,types}.ts`.
2. Move the canonical implementation from `utils/points.ts` (cleaned up to remove SQL-mirror artifacts).
3. `utils/points.ts` becomes a re-export shim (`export * from '@/lib/scoring'`) so existing callers keep compiling until they update imports.
4. (I1 path) Add a `points` column to `Match` and `ProdeUserGroupMatch` / `ProdeUserFinalsMatch`; write at match-result time; update ranking SQL to sum.
5. (I2 path) Replace TS scorer body with a Prisma raw call into a stored function.

**Pre-reqs:** Phase 1C green or triaged; Migration C done (Prisma 7 client).
**Done when:** only one scoring source exists, every Stage 1 test green, divergence report's "must fix" rows resolved.

---

### Migration J · Parameterize the raw SQL

**Sub-steps**
1. In `src/utils/raw.ts`, convert every `$queryRawUnsafe` to `$queryRaw` template literals with parameterized inputs.
2. Stage names, IDs, and per-round breakdowns all bind via `Prisma.sql` fragments rather than string concatenation.
3. (Optional) move the ranking query module to `src/lib/ranking/` if its surface grows enough to warrant it.

**Pre-reqs:** Phase 1C in place, Migration I done.
**Done when:** no `$queryRawUnsafe` call remains, Stage 1 SQL divergence tests green.

---

### Migration K · Hash room-join passwords
Build `src/lib/auth/passwords.ts` and remove the plaintext compare.

**Sub-steps**
1. Add a `passwordHash` column to `ProdeRoom`. Keep the existing `password` column (plaintext) temporarily for lazy migration.
2. On room create / room update: hash via the chosen library (decision in Open Decisions), write to `passwordHash`, write `null` to `password`.
3. On room join (`pages/api/[id]/checkpassword.ts` or its App-Router successor): if `passwordHash != null`, compare against the hashed value; otherwise (legacy row) compare against the plaintext, and if it matches, hash on the fly and clear the plaintext.
4. After a defined grace period, drop the `password` column in a follow-up migration.

**Pre-reqs:** Migration D done (the auth module exists).
**Done when:** no new plaintext writes, every room password compared via the hashed path, Stage 1 tests green.

---

### Migration L · Seed and extend for WC 2026
The flagship of the domain work. The `Stage` enum, the ranking SQL, the bracket UI, and the seed all currently assume the 2022 format (8 groups of 4, Round of 16). WC 2026 is 48 teams in 12 groups with a Round of 32.

**Sub-steps**
1. **Schema:** extend the `Stage` enum with `GROUP_I..GROUP_L` and `FINALS_16_1..FINALS_16_16`. Generate a Prisma migration.
2. **Ranking SQL** (`src/utils/raw.ts`): every hardcoded stage list (the per-round breakdown in `getFullRankingQuery`, the callers of `getSubqueryFinals`) learns the new stages. Add a `FINALS_16` column to the breakdown query.
3. **Scoring TS** (`src/lib/scoring/`): should already be enum-agnostic; the Stage 1 tests must stay green when the enum grows.
4. **Bracket UI** (`src/components/view/Finals/*`, `src/app/(room)/[id]/finals/page.tsx`, `src/app/finals/page.tsx`, `src/app/admin/finals/page.tsx`): add the R32 row. A generic stage-driven rewrite is a candidate (see open decisions).
5. **Seed** (`prisma/seed/`):
   - `countries.ts`: 48 `Country` rows for WC 2026.
   - `fixture.ts`: 72 group-stage `Match` rows.
   - `bracket.ts`: R32 + R16 + QF + SF + F + 3rd-place scaffolding.
   - `index.ts`: orchestrator (creates the `Prode` record, calls the three).
   - The fixture data either comes from a committed JSON snapshot or a live WebSearch at seed time (open decision).
6. **Verify:** all Stage 1 characterization tests stay green. New tests cover the R32 scoring path. The bracket UI renders without empty slots.
7. **Flag assets (TODO, non-blocking).** 22 new PNGs are needed in `public/flags/`. Until they are sourced, `CountryFlag` falls back to a placeholder (`public/default.png` via an `onError` handler on the `<img>`). The 26 reused codes already work, so this never blocks Migration L.
   - **Missing** (3-letter ISO; sub-national entrants follow the `GBR.x` precedent that Wales already uses as `GBR.4`): `DZA, AUT, BIH, CPV, CZE, COL, CIV, CUW, EGY, GBR.2`/`SCO` (Escocia), `HTI, IRQ, JOR, NOR, NZL, PAN, PRY, COD, ZAF, SWE, TUR, UZB`.
   - **Becomes unused** (kept in place, no cleanup): `CMR, CRI, DNK, GBR.4, POL, SRB`.
8. **Pending tickets (active blockers).**
   - `3L · WC 2026` still needs the real Round of 32 seed/data path, not just helper support and placeholder scaffold rows.
   - `4A · Playwright setup` is implemented, but the current `harness:check` pass is still only a stable 404 loop until the route blocker is fixed.
   - `4B · Baselines` remain invalid product baselines because they currently pin 404 screenshots; they must be regenerated only after the route blocker is fixed.
   - `4C · Change loop` is wired, but it is not meaningful until the baselines represent real UI screens.
   - The current branch still needs the routing fix that makes Next serve the populated `src/pages/` tree; until that is resolved, the app serves 404s and the migration cannot be considered working end-to-end. Do not assume the root cause is an empty root `pages/` directory without re-verifying the tree.

**Pre-reqs:**
- Stage 1 green.
- Migration H done (the bracket UI is rewritten on Tailwind + Radix as part of the redesign).
- Migration I done (single scoring source absorbs the new stages cleanly).
- Migration J done (parameterized SQL makes the stage-list updates safer).

**Done when:** dev DB seeded with 2026 fixture, every WC 2026 route renders, Stage 1 tests green (including new R32 cases), and the harness baselines are captured from the real UI rather than 404 pages.

---

### Migration M and beyond (deferred)
- Split god-files (`Winners.tsx`, `queries.ts`, `finals.tsx`). Needs Stage 4 harness in production use for safe visual regression.
- Multi-tournament support (multiple active `Prode` records).
- CDN / storage moves for the Instagram share-asset pipeline.

---

### Gate after Stage 3
Each migration ships behind its own PR with its own review. Stage 3 is "done" when:
- the working tree matches the **Target tree** in this document
- the running stack matches the **Target stack** table
- every tutor in Stage 2 has zero **retained warnings** left
- Stage 1 tests are still green
- `tests/sql/divergence-report.md` has no unresolved rows

---

## Stage 4 · Give it eyes · the harness

Visual feedback for any post-migration UI work (especially the Tailwind redesign from Migration H and the new R32 bracket layout from Migration L). Playwright plus committed baselines so the agent can see what it produced.

### Choices
- **Tool:** Playwright (`@playwright/test`)
- **Mode:** headless screenshots committed under `harness/baseline/*.png`. Pixel-diff on re-run.
- **Scope:** a small set of representative screens, not the whole app.

### Phase 4A · Playwright setup
- Add `@playwright/test`, run `npx playwright install chromium`.
- `playwright.config.ts` pointing at `http://localhost:3000`.
- `harness/` directory: scripts plus `baseline/` PNGs.
- Pre-flight script that boots Next dev and waits for the port before running.
- Pending until the route blocker above is fixed: do not treat the current `harness:check` pass as product validation, because it is still exercising 404s.

### Phase 4B · Baseline screenshots
Routes to capture:
- `/` (landing)
- `/login`
- `/rooms` (logged-in shell)
- `/[id]/view` (a room view)
- `/[id]/ranking` (the leaderboard)
- `/admin` (admin shell)

Fixture user via a NextAuth dev provider or a seeded session cookie (decision below in Open Decisions).

- Pending: regenerate baselines after the app serves real pages. Any PNGs captured before that are just error-page references and must be replaced.

- **Done when:** `npm run harness:baseline` produces all PNGs deterministically (same hash on two consecutive runs).

### Phase 4C · The change loop
- `npm run harness:check` re-screenshots and diffs against baseline.
- Workflow for the agent: `harness:check` → look at the PNGs → edit SCSS or component → `harness:check` again → compare.
- Pending: the change loop is only meaningful once the baselines represent real UI screens. Until then, it is a stable 404 loop, not a visual-regression loop.

### Gate after Stage 4
Human reviews the baselines for any UI bugs accidentally pinned. Sign-off means the harness is the trusted before-state for any visual change.

---

## Phases and gates (the full sequence)

| Phase | Output | Human review |
|---|---|---|
| ✅ 0 · Plan | this `PLAN.md` | read it, edit it, sign off. |
| ✅ 1A · Vitest setup | `npm test` runs, coverage configured, `tests/` and aliases in place | command runs cleanly |
| ✅ 1B · Pin TS scoring | golden-master tables green, ≥ 90% on `utils/points.ts` and the scoring slice of `utils/queries.ts` | review fixtures for realism |
| ✅ 1C · Pin SQL scoring | `tests/sql/divergence-report.md` complete; `prode-test-db` service in `docker-compose.yml`; `test:db:up` / `test:db:reset` scripts | triage each divergence |
| ✅ 1D · Pin queries.ts writes | `registerUserToRoom`, `syncronize*`, `deleteUserProde` characterized; `fileParallelism: false` in vitest config | review write-path scenarios |
| ✅ 2 · Tutor (target spec) | 8 `AGENTS.md` files plus `CLAUDE.md` symlinks | read all eight, edit until they match the target |
| ✅ 3A · Move into `src/` | working tree matches Target tree (structurally) | `npm run build` + tests green |
| ✅ 3B · Foundation tooling | TS 5, ESLint flat config, `tsx` scripts | lint + build clean |
| ✅ 3C · Prisma 4 → 6 | new client at `src/generated/prisma`, adapter-pg wired | dev app reads data, tests green |
| ✅ 3D · Auth module (`withAuth`) | `src/lib/auth/` created; `withAuth` wrapper ready; stays on next-auth@4 until Next 15 compat confirmed | smoke-test login per provider |
| ✅ 3E · Data layer (TanStack Query 5) | every consumer migrated to v5 object syntax | smoke-test data screens |
| ✅ 3F · Next 13 → 15 + React 19 | dev + build pass on Next 15 + React 19 | every page renders |
| ✅ 3G · Pages → App Router | no `src/pages/` directory remains; all routes in `src/app/` | every route accessible at its previous URL |
| ⬜ 3H · Tailwind 4 + Radix | no `*.module.scss` remains, `sass` removed | review the redesign, update harness baselines |
| ✅ 3I · Unify scoring | single source under `src/lib/scoring/`; `utils/points.ts` is a re-export shim | divergence report resolved |
| ✅ 3J · Parameterize SQL | no `$queryRawUnsafe` remains; `Prisma.sql` tagged templates throughout | tests green |
| ✅ 3K · Hash room passwords | `bcryptjs` hashing; lazy migration for legacy rooms; no new plaintext writes | smoke-test room join |
| ✅ 3L · WC 2026 | extended schema (12 groups, R32); seed split; R32 bracket UI | review schema migration + bracket before merge |
| ✅ 4A · Playwright setup | `harness:check` command runs | runs without flake |
| ✅ 4B · Baselines | committed PNGs | review for accidental UI bugs pinned |
| ✅ 4C · Change loop | `harness:check` loop works | end-to-end dry run |

---

## Non-goals

- Feature work beyond the WC 2026 seeding.
- Multi-tournament support (the schema stays single-`Prode`; 2026 replaces 2022 as the active tournament).
- Mobile app or PWA.
- Auth provider changes (Google / Facebook / GitHub / Twitter stay; Auth.js 5 is the wrapper migration, not a provider swap).
- ORM swap (Prisma stays; only the major-version upgrade).

---

## Open decisions

These need a human answer before execution begins.

1. **Scoring unification strategy** (Migration I): I1 (TS source, precompute points) or I2 (SQL source, TS wrapper)? Deferred until Phase 1C's divergence report exists.
2. **API handler test layer**: skip and trust types, or add a minimal handler-test helper to exercise `withAuth` outcomes (`401`, `403`, `404`, success) under the App Router signature?
3. **Hash algorithm for room passwords** (Migration K): `bcryptjs` (no native compile), `argon2` (stronger, native dep), or defer Migration K and keep the plaintext warning in `AGENTS.md`?
4. **Cruft at root**: delete `502.html` and `setup.sh` as part of Migration A (the `src/` move PR), or leave for a separate cleanup PR?
5. **i18n placement**: keep `locale/` under `src/locale/` (current intent) or fold into `src/lib/i18n/`? Either way, decide whether `useLocalizedText` gets its own tutor.
6. **Auth.js 5 beta tolerance** (Migration D): pin to a specific beta and accept the upgrade churn, or hold execution until 5.0 stable ships? If holding, what is the latest-acceptable stable date?
7. **Session strategy on cutover** (Migration D): truncate `Session` and `VerificationToken` (force re-login, cleanest) or migrate sessions in-place via a one-shot conversion script (zero-friction but risks signature mismatch)?
8. **Playwright session fixture** (Stage 4): seed a session cookie matching the Auth.js 5 format (simpler) or stand up a NextAuth dev provider (cleaner)?
9. **WC 2026 bracket UI** (Migration L): incrementally extend the existing `components/view/Finals/*` for R32, or rewrite as a generic stage-driven component during Migration H so the redesign and the bracket land together?
10. **2026 fixture seed mechanism** (Migration L): commit a JSON snapshot of the FIFA fixture into `prisma/seed/data/` (reproducible, no net at seed time), or have `prisma/seed/fixture.ts` do a live WebSearch at seed time (fresher, needs internet)?
11. **TanStack Query persistence** (Migration E): plain in-memory cache, or add `persistQueryClient` so cold-load screens feel snappier post-modernization?
12. **App Router data fetching style** (Migration G): server-component `await prisma.*` directly, or server actions, or always fetch via API routes? Pick one default and document it.
13. **Generated Prisma client output path** (Migration C): `src/generated/prisma/` (vendored, committed) or `node_modules/.prisma` (default, gitignored)? Affects tooling and DX.

When these are answered, execution can begin.
