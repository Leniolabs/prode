# `src/app/`: App Router routes and layouts

All Next.js 16 App Router files live here: root `layout.tsx`, `page.tsx` entry points, route groups `(auth)` and `(room)`, and the `api/` route handlers. Files that are not page or layout entry points belong elsewhere: data-fetching logic goes in `@/lib/` or `@/utils/`, UI fragments go in `@/components/` or `@/layout/`.

## Target conventions

> ✅ Every route entry point is `page.tsx`. Every shared shell is `layout.tsx`. API handlers are `route.ts` exporting named HTTP verbs (`GET`, `POST`, etc.).
> ✅ Default to server components. Add `'use client'` only when the file uses hooks, browser APIs, or event handlers.
> ✅ Replace `getServerSideProps` with direct `await prisma.*` calls inside the server component body.
> ✅ Export `generateMetadata` from any page that needs per-route `<head>` content instead of using a `<Meta>` component.
> ✅ Route groups `(auth)/` and `(room)/` organize related routes without adding URL segments.
> ✅ All API routes use `withAuth` from `@/lib/auth/withAuth`. No hand-rolled auth ladder anywhere in this directory.

## Retained warnings

> ⚠️ Retained warning until Migration G lands: `pages/` directory still exists and serves all routes. This `src/app/` directory is the target; the Pages Router files are migrated route-by-route in Migration G.
> ⚠️ Retained warning until Migration F lands: Next.js 13 is active. Async request APIs (`headers()`, `cookies()`, `params`, `searchParams`) are synchronous today; they become Promises in Next 16. Do not add new callers of the synchronous form.
> ⚠️ Retained warning until Migration D lands: `src/app/api/` route handlers still reference the hand-rolled auth ladder in places. See `src/app/api/AGENTS.md` for the full picture.

## Imports

- Use `@/...` aliases for everything outside this directory.
- Relative paths are acceptable within a single route folder (e.g. a local `_components/` subfolder).
- Import Prisma client as `import { prisma } from '@/lib/prisma'`.
- Import auth helpers as `import { withAuth } from '@/lib/auth/withAuth'`.
