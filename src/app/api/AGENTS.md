# `pages/api/` tutor

This directory (after Migration G: `src/app/api/`) contains all HTTP route handlers for the app.

## Current vs target shape

> ⚠️ Retained warning until Migration G lands: routes use the Pages Router signature: a single `export default async function handler(req, res)` in `pages/api/<name>.ts`. After Migration G each route becomes `src/app/api/<name>/route.ts` exporting named functions `GET`, `POST`, `PUT`, or `DELETE` (App Router shape). Do not add new pages-router handlers. If a new endpoint is needed before Migration G, follow the existing pattern and mark it for migration.

> ✅ Target convention (after Migration G): every route handler lives at `src/app/api/<name>/route.ts` and exports only the HTTP methods it handles (`export async function GET(...)`, `export async function POST(...)`, etc.). No default export.

## Auth (retained warning)

> ⚠️ Retained warning until Migration D lands: 18 of 23 routes hand-roll the auth ladder: `getSession(req)`, check for session, `getUserByEmail`, check for blocked user, `getProdeRoom`, ownership check. This is error-prone and has no single place to audit. Do not write a new hand-rolled auth ladder. Once `withAuth` exists (Migration D), migrate existing routes one PR at a time.

> ✅ Target convention (after Migration D): every route handler is wrapped with `withAuth` from `@/lib/auth/withAuth`:
> ```ts
> export const POST = withAuth(async (req, { session, user, room }) => {
>   // handler body
> }, { ownership: 'room' })
> ```
> The `ownership` option accepts `'room'` (verifies `room.userId === user.id`) or `'admin'` (verifies `user.role === 'ADMIN'`). When omitted, only session validity and the blocked-user check are enforced.

## Response shape

> ✅ Target convention: success responses return `{ id }` (the created or updated resource ID). Failure responses return a bare HTTP status code with an empty `{}` body. This contract is preserved across Migration G and Migration D. Do not change it.

## Password handling (retained warning)

> ⚠️ Retained warning until Migration K lands: `pages/api/[id]/checkpassword.ts` stores and compares room-join passwords in plaintext (`room.password !== password`). Do not extend this pattern. Any new password field must be hashed from day one using `@/lib/auth/passwords` (bcrypt or argon2, decided at Migration K). Migration K adds a `passwordHash` column and retires the plaintext compare with a lazy-migration path for existing rooms.

## Route inventory

Current shape (source still at `pages/api/`; Migration G moves each entry into `src/app/api/<name>/route.ts`):

```
pages/api/
  auth/[...nextauth].ts        Auth.js catch-all
  countries.ts                 GET list
  create.ts                    POST room
  profile.ts                   PUT user profile
  groups.ts                    POST group predictions (template)
  finals.ts                    POST finals predictions (template)
  check-room-name.ts           GET name-availability check
  [id]/
    update.ts                  PUT room settings
    delete.ts                  DELETE room
    leave.ts                   POST leave room
    groups.ts                  POST group predictions for a room
    finals.ts                  POST finals predictions for a room
    checkpassword.ts           POST password check (plaintext, see warning above)
    video.ts                   GET story video
    story-image.ts             GET story image
    story-video.ts             GET story video (alt)
  admin/
    reset.ts                   POST reset predictions
    prune.ts                   POST prune stale data
    finals.ts                  POST admin finals results
    groups.ts                  POST admin group results
    finals-start.ts            POST start finals phase
    rooms/[id]/delete.ts       DELETE a room (admin)
    users/[id]/block.ts        POST block/unblock user
```

## Import rules

- Import auth helpers via `@/lib/auth/withAuth` after Migration D.
- Import query helpers via `@/utils/queries` or `@/lib/scoring` as appropriate.
- No relative paths that cross the `pages/api/` boundary.
