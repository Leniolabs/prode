---
name: screenshot
description: Take a full-page screenshot of a route on the running Next.js dev server via Playwright headless Chromium. Use when the user asks to see how a page renders, to verify a visual change after editing components or styles, or to capture before/after for a redesign. Requires the dev server on http://localhost:3000.
---

# Screenshot Skill

## When to use

- The user asks to "screenshot", "take a picture of", "show me what /x looks like".
- You just edited a component, page, or stylesheet and want to verify the result visually.
- You are checking a page renders after a migration (e.g. that `/groups` shows all 12 WC 2026 groups, not just A–H).

## Prerequisite

The Next.js dev server must be running on port 3000:

```bash
npm run dev
```

If `curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/` does not return `200` or `307`, the server is not up. Start it first; do not assume it is running.

## How to invoke

```bash
npm run screenshot -- <route> [--output <path>] [--no-auth] [--user <email>]
```

Defaults:
- **route**: `/`
- **auth**: enabled. Signs in as `playwright@dev.local` via the NextAuth dev provider (`CredentialsProvider`, `id: "dev"`). The dev provider only exists when `NODE_ENV === "development"`.
- **output**: `harness/screenshots/<route-slug>.png` (slug derived from the route).
- **user**: `playwright@dev.local`. Pass `--user other@dev.local` to act as a different (or new) user; the dev provider creates the user on first login.

## Examples

```bash
npm run screenshot -- /                          # home, default output
npm run screenshot -- /login --no-auth           # public, no session
npm run screenshot -- /rooms                     # logged-in shell as playwright@dev.local
npm run screenshot -- /groups                    # show all 12 WC 2026 groups
npm run screenshot -- /admin --user admin@dev.local --output harness/screenshots/admin-fresh.png
```

## What it does

1. Boots headless Chromium via Playwright (1280x800 viewport).
2. If `--no-auth` was not passed: fetches the CSRF token, POSTs to `/api/auth/callback/dev` with the credentials, and stores the resulting session cookie in the browser context.
3. Navigates to `http://localhost:3000<route>` and waits for `networkidle`.
4. Captures a full-page screenshot.
5. Writes to the output path (parent directory is created if missing).

## After taking a picture

Use the `Read` tool to view the PNG and confirm what was rendered. If the page shows an unexpected redirect (e.g., to `/login`), the dev server may not have the dev provider available (check that `NODE_ENV` is `development`, restart the server if you just changed the auth config).

## Where pictures live

- Default output directory: `harness/screenshots/` (gitignored, these are ad-hoc captures).
- For committed visual-regression baselines, use `harness/baseline/` (a future Stage 4 phase will add the baseline/diff loop).

## Limits

- This skill captures a single route. To capture multiple routes, invoke the script multiple times.
- It does not perform pixel diffing yet (that is the planned `harness:check` loop in Stage 4 Phase 4C).
- The dev provider is only available when `NODE_ENV=development`. In production builds, the script with `--auth` will fail at the CSRF/callback step.
