# Prode: Agent Tutor (root)

This document describes the **target** state of the codebase. Retained warnings mark traps that survive until their named migration lands.

---

## Commands

```sh
npm install                  # install dependencies
npm run dev                  # start dev server (requires .env with DATABASE_URL and OAuth secrets; see .env.example)
npm run build                # production build
npm run lint                 # ESLint (flat config, eslint.config.js)
npm test                     # run all tests (no DB required for pure-TS tests)
npm run test:db:up           # boot test Postgres on :5433, run prisma db push
npm run test:coverage        # run tests with v8 coverage report
npm run test:db:reset        # destroy and re-create the test DB cleanly
npm run harness:check        # screenshot and diff against harness/baseline/*.png (Stage 4)
```

---

## Architecture

The app is a Next.js 16 App Router project backed by Prisma 7 (with `@prisma/adapter-pg`, generated client at `src/generated/prisma/`), Auth.js 5 for OAuth (Google, Facebook, GitHub, Twitter), Tailwind CSS 4 for styling, and TanStack Query 5 for client-side data fetching. Domain: a single global `Prode` record holds a tournament; users join `ProdeRoom`s and submit match score predictions; rankings are computed with SQL window functions and surfaced via the scoring engine in `src/lib/scoring/`.

---

## Landmines

These traps are confirmed in the current code. Each will be retired by the listed migration.

| # | Trap | Location | Retiring migration |
|---|------|----------|--------------------|
| 1 | Scoring rules duplicated in TS (`utils/points.ts`) and SQL (`utils/raw.ts`). TS drives per-match badges; SQL drives leaderboards. Drift is silent. | `utils/points.ts`, `utils/raw.ts` | **Migration I** |
| 2 | `$queryRawUnsafe` with string-interpolated values (room IDs, stage names). Low injection risk in practice but wrong template. | `utils/raw.ts` | **Migration J** |
| 3 | Single-tournament assumption: `prisma.prode.findFirst({})` is called without a filter throughout `utils/queries.ts`. | `utils/queries.ts` lines ~134, ~148, ~286, ~405 | **Migration M (deferred)** |
| 4 | Auth ladder copy-pasted in 18 of 23 API routes: `getSession, getUserByEmail, getProdeRoom, ownership check` in every file. One missed check is a hole. | `pages/api/*.ts` | **Migration D** |
| 5 | Room-join passwords stored and compared in plaintext. | `pages/api/[id]/checkpassword.ts:39` | **Migration K** |
| 6 | God-files: `components/view/Winners.tsx` (1849 lines), `utils/queries.ts` (1017 lines), `pages/[id]/finals.tsx` (919 lines). | see filenames | **Migration M (deferred)** |
| 7 | `19 as any` / `@ts-ignore` escapes despite `strict: true`. The known safe one is `lib/prisma.ts` (dev hot-reload global). Others must not be added. | scattered | **Migration B** |
| 8 | Root-level cruft: `502.html` (487 KB Heroku error page), `setup.sh` (patchelf hack for canvas). | repo root | **Migration A** |

> ⚠️ Retained warning until Migration I lands: any change to scoring logic must update **both** `utils/points.ts` and `utils/raw.ts`, then keep the Stage 1 tests green.

> ⚠️ Retained warning until Migration J lands: `utils/raw.ts` uses `$queryRawUnsafe`. New queries must use parameterized `$queryRaw` template literals.

> ⚠️ Retained warning until Migration D lands: every new API route must copy the auth ladder from an existing route. After Migration D, use `withAuth` from `@/lib/auth/withAuth` instead.

> ⚠️ Retained warning until Migration K lands: `checkpassword` compares passwords in plaintext. Do not extend that pattern.

---

## Layered model

| Layer | Path | Rule |
|-------|------|------|
| UI + routes | `src/app/` | App Router pages and route handlers. Server components by default; `'use client'` only when hooks or browser APIs are needed. |
| Engine | `src/lib/` | Cross-cutting domain logic: `lib/auth/`, `lib/scoring/`, `lib/prisma.ts`. No React. Pure TypeScript and Prisma only. |
| Small helpers | `src/utils/` | Dependency-free pure functions: array, classname, date, share, images, email. No React, no domain logic. |
| Feature UI | `src/components/` | Feature-specific components. Every component is `Name.tsx + index.ts` barrel. Shell primitives are NOT here. |
| Shell primitives | `src/layout/` | Page-level layout components: Card, Container, Header, Layout, Footer. |

UI imports lib; lib never imports UI. `lib/` and `utils/` never import React. New cross-cutting domain logic goes in `lib/`; new small helpers in `utils/`; new shell primitives in `layout/`; new feature components in `components/`.

Relative imports are allowed only inside a single sub-module. All cross-module imports use path aliases (see below).

---

## Path-alias contract

Defined in `tsconfig.json` `compilerOptions.paths` and wired into Vitest via `vite-tsconfig-paths`:

| Alias | Resolves to |
|-------|-------------|
| `@/*` | `src/*` |
| `@test/*` | `tests/*` |

Examples: `@/lib/scoring`, `@/lib/auth/withAuth`, `@/utils/raw`, `@/components/view/Winners`.

These aliases are the stable contract. File locations under `src/` can change across migrations without rewriting imports.

---

## Non-goals

- Feature work beyond the WC 2026 seeding (Migration L).
- Multi-tournament support. The schema stays single-`Prode`; 2026 replaces 2022 as the active tournament.
- Mobile app or PWA.
- Auth provider changes. Google, Facebook, GitHub, and Twitter stay. Migration D is a wrapper migration, not a provider swap.
- ORM swap. Prisma stays; only the major-version upgrade (Migration C).
