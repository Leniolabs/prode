# `utils/` tutor

This directory (after Migration A: `src/utils/`) is the small-helpers layer. It holds pure, dependency-free functions that do not belong to any domain module.

## What lives here

- Array helpers (`array.ts`)
- CSS classname helpers (`classname.ts`)
- Date formatting helpers (`date.ts`)
- Share URL and media helpers (`share.ts`)
- Image helpers (`images.ts`)
- Email helpers (`email.ts`)
- Redirect helpers (`redirect.ts`)
- Error helpers (`errors.ts`)
- API fetch wrappers (`api.ts`)

## What does NOT live here

- Cross-cutting domain logic: move to `src/lib/`. Examples: auth, scoring, ranking.
- React hooks or components: move to `hooks/` or `components/`.
- Anything that imports `prisma` or a framework package directly.

## Scoring split (retained warning)

> ⚠️ Retained warning until Migration I lands: scoring is split across two files and a SQL layer. `utils/points.ts` contains status helpers (`matchResultStatus`, `matchFinalResultStatus`, `matchCountriesMatchStatus`) and winner/loser helpers (`getAdminMatchWinner`, `getFinalsMatchWinner`, etc.). `utils/queries.ts` contains the point arithmetic functions (`finalMatchPoints`, `computeFinalMatchPoints`, `computeGroupMatchPoints`). `utils/raw.ts` carries a parallel SQL implementation of the same rules inside `getSubqueryFinals` and `getSubqueryGroups`. Any change to scoring logic must update ALL three locations and keep the Stage 1 characterization tests green. The TS-vs-SQL divergence documented in `tests/sql/divergence-report.md` is part of Migration I's exit criteria.

> ✅ Target convention (after Migration I): scoring lives exclusively under `src/lib/scoring/` (`index.ts`, `group.ts`, `finals.ts`, `types.ts`). `utils/points.ts` becomes a re-export shim: `export * from '@/lib/scoring'`. Callers import from `@/lib/scoring` or `@/utils/points` interchangeably; the latter is the shim until all imports are updated.

## Raw SQL (retained warning)

> ⚠️ Retained warning until Migration J lands: `utils/raw.ts` uses `$queryRawUnsafe` with string-interpolated values (room IDs, stage names). The practical injection risk is low because values come from DB-sourced cuids, but it is the wrong pattern to extend. New queries must use parameterized `$queryRaw` template literals with `Prisma.sql` fragments. The existing calls get migrated in Migration J.

## God-file warning

> ⚠️ Retained warning until Migration F+ lands: `utils/queries.ts` is 1000+ lines and covers both read paths (getters) and write paths (`registerUserToRoom`, `syncronizeTemplate`, `syncronizeFinalsTemplate`, `deleteUserProde`). Read Phase 1B notes before editing any scoring function. Read Phase 1D notes before editing any write path. Do not add new functions to `queries.ts` without first checking whether they belong in `src/lib/` instead.

## Import rules

- Import via alias: `import { cn } from '@/utils/classname'`.
- No relative paths crossing directory boundaries.
- No React imports inside this directory.
