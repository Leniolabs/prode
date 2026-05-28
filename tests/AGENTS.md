# Tests: Agent Tutor

This directory holds all characterization, unit, and SQL integration tests. It **never moves** through any migration. Test imports and fixture paths are stable across every Stage 3 migration.

---

## Purpose

- **Pure-TS unit tests** (`tests/*.test.ts`): characterize the scoring engine and other pure functions without a DB.
- **SQL integration tests** (`tests/sql/*.test.ts`): seed the test DB, run raw SQL queries, and compare results to the TS implementation.
- **Write-path tests** (`tests/queries-*.test.ts`): characterize multi-step Prisma writes (`registerUserToRoom`, `syncronizeTemplate`, `syncronizeFinalsTemplate`, `deleteUserProde`).

> ✅ Target convention: new tests follow the same pattern. Pure-TS tests live at `tests/<topic>.test.ts`. SQL tests live at `tests/sql/<topic>.test.ts`. Fixtures live at `tests/fixtures/<topic>.ts`.

---

## Layout

```
tests/
  scoring.test.ts            pure-TS scoring characterization (Phase 1B)
  queries-register.test.ts   registerUserToRoom scenarios (Phase 1D)
  queries-sync.test.ts       syncronize* scenarios (Phase 1D)
  queries-delete.test.ts     deleteUserProde scenarios (Phase 1D)
  fixtures/
    scoring.ts               golden-master scoring cases
    queries-register.ts      fixtures for registerUserToRoom
    queries-sync.ts          fixtures for syncronize*
    queries-delete.ts        fixtures for deleteUserProde
  sql/
    divergence.test.ts       TS vs SQL side-by-side comparison (Phase 1C)
    divergence-report.md     generated Markdown table: fixture | TS | SQL | delta | hypothesis
```

---

## Path aliases

Import production code via path aliases only. Never use relative paths that cross into `src/`.

```ts
import { matchResultStatus } from '@/utils/points'
import { finalMatchPoints } from '@/utils/queries'
import { FINALS_SCORING } from '@test/fixtures/scoring'
```

After Migration A moves code into `src/`, only the alias target in `tsconfig.json` changes (`@/*` shifts from `./*` to `./src/*`). Test imports remain identical.

---

## Fixture convention

Fixtures are typed TypeScript object exports in `tests/fixtures/`. Each fixture is an array of objects with `name`, `input`, and `expected` fields (or equivalent). Using `as const` preserves literal types.

```ts
export const FINALS_SCORING = [
  { name: 'exact score with penalties', input: { /* ... */ }, expected: 5 },
  { name: 'winner correct goals exact', input: { /* ... */ }, expected: 3 },
] as const
```

Tests use `describe` per feature category and `it.each` over the fixture array so each row reads as a user-facing scenario, not a code branch.

---

## Test DB

- Postgres on `localhost:5433`, database `prode_test`.
- Boot: `npm run test:db:up` (starts the `prode-test-db` Docker service and runs `prisma db push`).
- Reset: `npm run test:db:reset` (destroys and re-creates the container, then runs `test:db:up`).
- The `vitest.config.ts` sets `DATABASE_URL` to the test DB so the singleton in `lib/prisma.ts` finds it without manual env setup.
- The dev DB (`:5432`) is never touched by tests.

> ⚠️ Retained warning until Migration I lands: `divergence.test.ts` is expected to find rows where TS and SQL disagree. Do not "fix" divergences here. Log them in `tests/sql/divergence-report.md` with a hypothesis. Migration I owns the resolution.

---

## File parallelism

`vitest.config.ts` sets `fileParallelism: false`. DB tests step on each other when parallel because one file's cleanup truncates rows another file seeded. Serial execution costs about one second on the pure-TS tests; the determinism is worth it.

---

## Coverage

`npm run test:coverage` reports v8 coverage. Targets enforced in `vitest.config.ts`:

- `utils/points.ts`: 90% lines, functions, statements; 85% branches.
- `utils/queries.ts` and `utils/raw.ts` are included in the coverage report but have no enforced threshold (they require a live DB for full coverage).
