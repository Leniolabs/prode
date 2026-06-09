# Playwright Flow Test Plan

This plan defines end-to-end flow tests for Prode using Playwright, with all backend responses mocked at the network layer. No database, no real OAuth, and no real `/api/*` handlers are exercised. Tests run against a live `npm run dev` server that serves the App Router pages; every `fetch('/api/...')` call the client makes is intercepted and answered with fixture data.

The recommendation is to build this as a self-contained `e2e/` module separate from the existing `harness/` visual-regression setup, authenticate by mocking `/api/auth/session` (no DB, no `harness/signin`), and cover all four scenario groups: core user flows, admin flows, edge/error scenarios, and profile/room editing.

---

## 1. Why mock-at-network, and what it implies

The app loads every page through TanStack Query calls to a small set of `GET /api/*-page-data` endpoints, and writes through plain `POST/PUT/DELETE/PATCH` JSON endpoints. All use native `fetch` with relative URLs. This makes `page.route()` interception the right seam: we intercept by URL glob, return canned JSON, and assert on the rendered UI and on the request bodies the client sends.

Two app-specific behaviors the mocks must respect:

1. **Redirect-by-body convention.** Several GET endpoints (`finals-page-data`, `room-groups-data`, `room-finals-data`, `view-page-data`) return HTTP 200 with `{ "redirect": "/some/path" }` rather than an HTTP redirect. The client reads that field and calls `router.push()`. Mocks for negative-access scenarios must return 200 with a redirect body, and the test asserts the resulting navigation.

2. **Session gating.** Page queries set `enabled: session.status === "authenticated"`. A mocked `/api/auth/session` that returns a populated session object makes `next-auth/react`'s `useSession` resolve to `authenticated`, which unblocks the data queries. Returning `{}` (empty) makes pages treat the user as unauthenticated, which triggers `useRequireSession -> signIn("google")` — the exact path the blocked/unauthenticated edge tests assert.

---

## 2. Infrastructure setup

### 2.1 Directory layout

```
e2e/
  playwright.config.ts        # own config; webServer boots `npm run dev`
  fixtures/
    auth.ts                   # session objects (authenticated user, admin, empty)
    rooms.ts                  # rooms-page-data, room records
    matches.ts                # group + finals match arrays, countries
    ranking.ts                # ranking rows with per-stage breakdown
    pageData.ts               # composed page-data payloads built from the above
  support/
    mockApi.ts                # central route-mock installer (see 3.2)
    test.ts                   # extended Playwright `test` with mock + auth fixtures
    selectors.ts              # shared locators / data-testid constants
  specs/
    auth.spec.ts              # core: login redirect, authenticated entry
    rooms.spec.ts             # core: lobby, join open/password room
    create-room.spec.ts       # core: create flow + name-availability
    groups.spec.ts            # core: submit group predictions
    finals.spec.ts            # core: submit finals predictions
    ranking-view.spec.ts      # core: ranking, view another user's prode
    admin.spec.ts             # admin: dashboard, results, start/reset/prune, block, delete
    edge.spec.ts              # edge: wrong pw, domain mismatch, blocked, deadline, leave
    profile-room-edit.spec.ts # profile edit + room edit
  TEST_PLAN.md                # this file
```

Keeping a separate `playwright.config.ts` here avoids colliding with `harness/playwright.config.ts` (whose `testDir` is `"./"`).

### 2.2 Config

`e2e/playwright.config.ts`:

- `testDir: "./specs"`.
- `use.baseURL: "http://127.0.0.1:3000"`.
- `webServer: { command: "npm run dev", url: "http://127.0.0.1:3000", reuseExistingServer: !process.env.CI, timeout: 120_000 }`.
- `use.viewport: { width: 1280, height: 800 }`, `locale: "en-US"` (mirrors the harness so rendered i18n strings match).
- Single Chromium project to start; add mobile project later if mobile-header flows are wanted.
- `fullyParallel: true` is safe because every test owns its own mocked network and there is no shared DB state.

The dev server needs `.env` values for the app to boot, but since all `/api/*` calls are intercepted before reaching handlers, OAuth secrets and `DATABASE_URL` do not need to be real for these tests. Document the minimal env in the e2e README. If the dev server refuses to boot without a reachable Postgres at import time, fall back to setting placeholder env vars; the handlers are never invoked.

### 2.3 package.json scripts

```json
"e2e":          "playwright test --config e2e/playwright.config.ts",
"e2e:headed":   "playwright test --config e2e/playwright.config.ts --headed",
"e2e:ui":       "playwright test --config e2e/playwright.config.ts --ui"
```

No new dependencies: `@playwright/test@^1.60.0` is already installed.

---

## 3. Auth and mocking strategy

### 3.1 Session fixtures (`fixtures/auth.ts`)

Three canned `/api/auth/session` bodies:

- `sessionUser` — a normal authenticated user (`{ user: { id, name, email, image }, expires }`).
- `sessionAdmin` — same shape, with the email the app treats as admin. Because admin checks happen server-side and we mock the admin data endpoints directly, the email value mainly drives any client-side admin affordances; the authoritative admin behavior comes from the mocked `room-*-data.roomAdmin` flag and the admin page-data mocks.
- `sessionEmpty` — `{}` to simulate unauthenticated.

### 3.2 Central mock installer (`support/mockApi.ts`)

A single function `installApiMocks(page, overrides)` registers `page.route` handlers for the full `/api/*` surface with sensible defaults, and accepts per-test overrides keyed by endpoint. This keeps specs declarative: a test states only the deltas it cares about (for example, "make `checkpassword` return `WRONG_PASSWORD`").

Default handlers to register:

| Endpoint (glob) | Default response |
|---|---|
| `**/api/auth/session` | `sessionUser` (overridable) |
| `**/api/auth/providers` | minimal providers object so `signIn` does not 500 |
| `**/api/countries` | fixture country list |
| `**/api/rooms-page-data` | lobby with one open + one password room |
| `**/api/new-prode-page-data` | userRanking + registeredProdes |
| `**/api/check-room-name*` | `{ allowed: true }` |
| `**/api/create` | `{ id: "clnewroom" }` |
| `**/api/groups-page-data*` | group matches, finals not started |
| `**/api/finals-page-data*` | `{ redirect: "/groups" }` by default |
| `**/api/room-groups-data*` | room groups payload, `roomAdmin: false` |
| `**/api/room-finals-data*` | finals payload |
| `**/api/room-ranking-data*` | ranking with per-stage breakdown |
| `**/api/room-results-data*` | top-4 ranking |
| `**/api/view-page-data*` | public user's matches |
| `**/api/[id]/checkpassword` | `{ allowed: true }` |
| `**/api/[id]/groups`, `**/api/groups` | echo posted matches |
| `**/api/[id]/finals`, `**/api/finals` | `{}` / 201 |
| `**/api/[id]/leave`, `**/api/[id]/delete` | `{}` |
| `**/api/[id]/update` | `{ id }` |
| `**/api/profile` | `{}` |
| `**/api/admin-page-data*` | counts + rooms + users |
| `**/api/admin-finals-data` | knockout matches |
| `**/api/admin/**` | `{}` (reset, prune, finals, finals-start, rooms/x/delete, users/x/block) |

Register a final catch-all `**/api/**` that `route.fulfill`s an empty 200 and logs, so an unmocked endpoint fails loudly rather than hanging the page.

### 3.3 Test fixture (`support/test.ts`)

Extend Playwright's `test` with an auto-applied fixture that calls `installApiMocks(page)` in `beforeEach` (before the first `goto`, so interception is live for the initial page-data load). Expose a helper on the fixture to layer overrides mid-test (for example, to change a mock between two navigations).

### 3.4 Asserting requests

For mutation flows, capture the intercepted request in the route handler and assert on `route.request().postDataJSON()` so we verify the client sent the right payload (changed matches only, correct points config, etc.), not just that it navigated.

---

## 4. Fixture data factories

Build small factories so scenarios stay readable:

- `makeGroupMatch(overrides)` and `makeFinalsMatch(overrides)` returning the documented match shapes (group: `goalsLeft/Right`, `userGoalsLeft/Right`, `countryLeftId/RightId`, `stage`, `filled`, `disabled`; finals adds `penaltis*`, `userCountry*Id`, `countryStatus`, `resultStatus`).
- `makeRankingRow(overrides)` with `GROUP_A..GROUP_L`, `FINALS_16/8/4/2`, `FINAL`, `points`, `ranking`, `isAdmin`.
- `makeRoom(overrides)` and `makeUserRanking(overrides)`.
- Composed builders: `groupsPageData()`, `roomGroupsData()`, `roomFinalsData()`, `roomRankingData()`, `roomsPageData()`, `adminPageData()`.

Use deterministic IDs (`clroom1`, `cluserprode1`, `clcountry1`) and fixed dates so deadline math is stable. For deadline scenarios, set `submissionEndsAt` relative to a fixed clock and pin time with `page.clock` or by choosing past/future absolute timestamps.

---

## 5. Scenario matrix

### 5.1 Core user flows (`auth`, `rooms`, `create-room`, `groups`, `finals`, `ranking-view`)

1. **Unauthenticated landing.** `sessionEmpty`; visit `/`; assert redirect to `/login`; assert OAuth login button visible.
2. **Authenticated landing skips login.** `sessionUser`; visit `/login`; assert redirect to `/rooms`.
3. **Lobby renders rooms.** Visit `/rooms`; assert open room row and a password room row (lock icon) from `rooms-page-data`.
4. **Join open room.** Click the open room's enter button; assert navigation to `/<id>/groups` (or `/finals` when `finalsStarted: true`, covered as a variant).
5. **Join password room (correct).** Click locked room; `PasswordModal` opens; submit password; `checkpassword -> { allowed: true }`; assert navigation to the room.
6. **Create room happy path.** From `/rooms` go to `/new-prode`; fill name (mock `check-room-name -> allowed:true`), password, points; submit; `create -> { id }`; assert redirect to `/<id>/ranking`; assert posted body carries the points config.
7. **Submit group predictions.** On `/<id>/groups`, enter scores into `MatchInput`s; assert Save enables only after a change; submit; assert `POST /api/<id>/groups` body contains only changed matches.
8. **Submit finals predictions.** Mock `room-finals-data` with finals active and a bracket; enter scores/penalties and country picks where `showCountryStatus`; submit; assert `POST /api/<id>/finals` payload.
9. **View ranking.** On `/<id>/ranking`, assert rows render with per-stage columns; assert pagination control present when `totalPages > 1`; click a row; assert navigation to `/<userProdeId>/view`.
10. **View another user's prode.** Visit `/<userProdeId>/view`; assert read-only (disabled) inputs reflect the viewed user's picks.

### 5.2 Admin flows (`admin`)

11. **Admin dashboard.** `sessionAdmin` + `admin-page-data`; visit `/admin`; assert room/user/prode counts and tables render.
12. **Enter official finals results.** Visit `/admin/finals`; fill `MatchFinalsInput`s; submit; assert `POST /api/admin/finals` body shape (countries + goals + penalties).
13. **Start finals.** Click Start Finals; assert `POST /api/admin/finals-start` called.
14. **Reset and prune.** Click each; assert the respective `POST /api/admin/reset` and `/api/admin/prune` calls. Confirm any `confirm()` dialog via `page.on("dialog")`.
15. **Block user.** Click block on a user row; assert `POST /api/admin/users/<id>/block`.
16. **Delete room.** Click delete on a room row; assert `POST /api/admin/rooms/<id>/delete`.

### 5.3 Edge / error scenarios (`edge`)

17. **Wrong password.** `checkpassword -> { allowed: false, code: "WRONG_PASSWORD" }`; assert modal shows error, no navigation.
18. **Email-domain mismatch.** `checkpassword -> { allowed: false, code: "EMAIL_DOMAIN" }`; assert the domain-specific message.
19. **Blocked user.** Drive the blocked path: visiting `/blocked` renders the blocked screen; and with `sessionEmpty` on a protected page, assert `useRequireSession` triggers `signIn` (intercept the `/api/auth/signin/google` or provider call and assert it fires, rather than following the external redirect).
20. **Submissions ended.** Mock `room-groups-data` with `submissionEndsAt` in the past (and/or `disabled: true` matches); assert inputs are disabled and Save stays disabled.
21. **Redirect-body navigation.** `room-groups-data -> { redirect: "/<id>/checkpassword" }`; assert client navigates there. Repeat for `finals-page-data -> { redirect: "/groups" }` and `view-page-data -> { redirect: "/rooms" }` (private profile).
22. **Leave room.** On `/<id>/ranking`, click Leave Room; accept the `confirm()` dialog; assert `DELETE /api/<userProdeId>/leave` and resulting navigation.

### 5.4 Profile and room editing (`profile-room-edit`)

23. **Edit profile.** Open the header profile modal; change name, toggle `prodePublic`, toggle dark mode, change background; save; assert `PATCH /api/profile` payload.
24. **Edit room as admin.** With `roomAdmin: true`, open `EditRoomModal` via the header pencil icon; change name/password/points/public; save; assert `PUT /api/<roomId>/update` payload.

---

## 6. Selectors

Most current components key off i18n button text and structural attributes (`data-striped`, `data-locked`, placeholders). Prefer, in order: role-based locators (`getByRole("button", { name })`), placeholder/label text, then existing data attributes. Where a flow has no stable handle (room rows, save buttons, modal inputs), the plan adds a small number of `data-testid` attributes to the relevant components as a first implementation step, recorded in `support/selectors.ts`. Adding test ids is low-risk and avoids brittle text matching across locale changes. List the exact components needing ids: room row enter button (`rooms/page.tsx`), `PasswordModal` input/submit, `MatchInput` goal inputs, finals save button, `EditRoomModal` fields, profile modal fields.

---

## 7. Implementation phases

1. **Scaffold.** Create `e2e/playwright.config.ts`, `support/`, `fixtures/`, and add npm scripts. Land one smoke spec (authenticated `/rooms` renders) to prove the webServer + session mock + interception path end to end.
2. **Core flows.** Implement scenarios 1-10 with their fixtures and the `installApiMocks` defaults.
3. **Selectors pass.** Add the `data-testid`s identified in section 6 where text/structural selectors prove brittle.
4. **Admin + edge + profile/room-edit.** Implement scenarios 11-24.
5. **CI.** Add a GitHub Actions job (none runs tests today) that installs deps, runs `npx playwright install --with-deps chromium`, and runs `npm run e2e`. Mock-only tests need no service containers.

---

## 8. Risks and gotchas

- **Dev-server boot dependencies.** If `npm run dev` evaluates `DATABASE_URL` or OAuth env at startup and crashes without them, supply placeholder env in the e2e run. Handlers are never reached, so values can be fake; verify during phase 1.
- **`signIn("google")` external redirect.** Unauthenticated protected-page tests must assert the signIn call is initiated (intercept the provider/signin request) rather than following Google's real OAuth redirect, which is off-domain and not mockable cleanly.
- **Query timing.** Install mocks before the first `goto`. TanStack Query may also refetch on focus; disable refetch-on-focus is not needed if mocks are stable, but keep handlers idempotent.
- **Redirect-body vs HTTP redirect.** Do not mock these as 3xx. They are 200 + `{ redirect }`; mocking them as real redirects would not exercise the client navigation code.
- **Overloaded `[id]`.** `leave`/`delete`/`view-page-data`/story media use `UserProde.id`; `checkpassword`/`groups`/`finals`/`update` use `ProdeRoom.id`. Fixtures use distinct, clearly named IDs to avoid cross-wiring mocks.
- **Mobile flows.** Header navigation differs on mobile (`MobileHeaderMenu`). Deferred to a later mobile Chromium project unless prioritized.
