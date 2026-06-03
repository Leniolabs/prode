# `src/lib/`: Engine Layer

Cross-cutting domain logic. No React. No JSX. Pure TypeScript and Prisma only.
Route handlers, hooks, and components consume this layer; this layer never
imports them.

---

## Core conventions

> ✅ Target convention: every module under `lib/` exposes its public API
> through `index.ts`. Internal helpers stay private to the directory and are
> never imported from outside.

> ✅ Target convention: no React inside `lib/`. If you find yourself writing
> `import React` or `useState` here, the code belongs in `hooks/` or
> `components/`.

---

## `lib/prisma.ts`

> ✅ Target convention (post-Migration C): uses `@prisma/adapter-pg` wrapping a
> `pg.Pool`. Imports the generated client from `@/generated/prisma`, not from
> `@prisma/client`.

The dev hot-reload singleton guard (`global.__prisma`) is intentional and must
stay. It prevents connection leaks during Next.js fast refresh.

---

## `lib/auth/` (lands in Migration D)

> ✅ Target convention: exposes exactly these five files:
> - `auth.config.ts`: Auth.js 5 providers, adapter, session strategy, callbacks.
> - `withAuth.ts`: route-handler wrapper consumed by every API route.
> - `ownership.ts`: room and admin ownership checks, testable in isolation.
> - `passwords.ts`: hash and compare helpers (lands in Migration K).
> - `types.ts`: augmented Auth.js `Session` and `User` shapes.

Route handlers call `withAuth(handler, { ownership?: 'room' | 'admin' })` and
nothing else. No route file re-implements the auth ladder by hand.

> ⚠️ Retained warning until Migration D lands: the auth ladder
> (`getSession → 401 → getUserByEmail → 401 → getProdeRoom → 404 → ownership
> check`) is copy-pasted across 18 of 23 API routes. Do not add a new route
> that hand-rolls this pattern; Migration D will replace them all.

---

## `lib/scoring/` (lands in Migration I)

> ✅ Target convention: `lib/scoring/` is the single source of truth for all
> scoring logic. The public API is exported from `lib/scoring/index.ts`.
> Internal files:
> - `group.ts`: group-stage points.
> - `finals.ts`: knockout points, including penalty-shootout branches.
> - `types.ts`: `Match`, `UserMatch`, and `Room` shapes used by the scorer.

> ✅ Target convention: `src/utils/points.ts` becomes a re-export shim
> (`export * from '@/lib/scoring'`) after Migration I lands. Callers do not
> need to update imports immediately because the alias still resolves; the shim
> is the bridge.

> ⚠️ Retained warning until Migration I lands: scoring is currently split
> between `utils/points.ts` (TypeScript, drives per-match badges) and the SQL
> CASE expressions in `utils/raw.ts` (drives leaderboard totals). The two
> implementations can disagree silently. Any change to scoring logic before
> Migration I must update BOTH files and keep the Stage 1 characterization
> tests green.

---

## Adding a new module to `lib/`

1. Create the directory: `src/lib/<module>/`.
2. Write an `index.ts` that exports only the public API.
3. Keep internals inside the directory.
4. No React. No imports from `app/`, `components/`, `hooks/`, or `layout/`.
5. Import via `@/lib/<module>` everywhere outside the directory.
