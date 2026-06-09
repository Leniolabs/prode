# Plan: per-match "10 minutes before kickoff" locking (contingency)

Status: **not implemented — contingency only.** The live system uses phase-wide
deadlines (`groupSubmissionsEnd` / `finalsSubmissionsEnd`) pinned to the first
kickoff of each phase. This plan documents how to switch to (or add) per-match
locking if that policy is ever wanted again.

---

## 1. What "per-match" means

Each match locks independently 10 minutes before its own `match.date`, instead
of the whole phase locking at the first kickoff. A player could still edit a
late group match after early ones have kicked off.

Tradeoff vs. current setup:

| | Phase-wide (current) | Per-match (this plan) |
|---|---|---|
| Gameable? | No — whole phase locks at first kickoff | Partially — see results of finished matches before editing later ones |
| Granularity | one cutoff per phase | one cutoff per match |
| Config | 2 stored timestamps | none stored; derived from `match.date` |

Decision before building: is the goal to **replace** phase locking or **add**
per-match on top (lock if *either* the phase deadline passed *or* the match is
within 10 min)? The "add" variant is strictly safer and is the recommended
default — it keeps the gameable-proof phase guarantee and only tightens
individual matches. Steps below note where the two variants diverge.

---

## 2. Source of truth: a single helper in `lib/scoring` or `utils/date`

There is already a dead helper `getNextTenMinutesDate()` in
[`src/utils/date.ts`](../src/utils/date.ts) (no callers). Do **not** revive it
as-is — it returns "now + 10 min" which is the inverted form and easy to misuse.
Replace it with an intention-revealing predicate:

```ts
// src/utils/date.ts
const TEN_MINUTES_MS = 10 * 60 * 1000;

/** True once we are within 10 minutes of (or past) the match kickoff. */
export function matchLocked(matchDate: Date, now: Date = new Date()) {
  return matchDate.getTime() - TEN_MINUTES_MS <= now.getTime();
}
```

Keep this pure and dependency-free (it belongs in `utils/`, not `lib/`, since it
touches no Prisma and no domain types). Delete `getNextTenMinutesDate`.

---

## 3. Server enforcement (the part that actually matters)

The client `disabled` prop is cosmetic. The real guard is the `403` returned by
the write routes. Per-match locking must be enforced there, per submitted match,
because a phase-wide check can no longer reject the whole request.

Routes to change (all four POST handlers that today call
`groupSubmissionsEnded` / `finalsSubmissionsEnded`):

| Route | Today |
|---|---|
| [`src/app/api/groups/route.ts`](../src/app/api/groups/route.ts) | `if (groupSubmissionsEnded(userProde)) 403` |
| [`src/app/api/[id]/groups/route.ts`](../src/app/api/[id]/groups/route.ts) | same, room-scoped |
| [`src/app/api/finals/route.ts`](../src/app/api/finals/route.ts) | `if (finalsSubmissionsEnded(userProde)) 403` |
| [`src/app/api/[id]/finals/route.ts`](../src/app/api/[id]/finals/route.ts) | same, room-scoped |

New logic per route:

1. Load the `Match` rows referenced in the request body (by id) with their
   `date`. The sync functions in `utils/queries.ts`
   (`syncronizeTemplate` / `syncronizeFinalsTemplate`) already fetch matches —
   thread the `date` through rather than adding a second query.
2. For each submitted prediction, reject *that match's* update if
   `matchLocked(match.date)`. Two implementation choices:
   - **Reject whole request (simplest):** if any submitted match is locked,
     return `403`. Easy, but a stale client could fail an otherwise-valid batch.
   - **Filter locked matches (better UX):** silently drop locked matches from
     the write set, persist the rest, return `200` with a list of skipped ids.
3. **"Add" variant:** keep the existing phase-deadline `403` as an outer guard
   *before* the per-match loop. **"Replace" variant:** remove the
   `groupSubmissionsEnded` / `finalsSubmissionsEnded` calls.

Put the per-match decision in `lib/scoring` or a new `lib/deadlines` module so
both group and finals routes share one tested function — do not copy the loop
into four files (that repeats Landmine #4). Signature suggestion:

```ts
// lib/deadlines/index.ts
export function partitionByLock<T extends { matchDate: Date }>(
  items: T[], now?: Date,
): { writable: T[]; locked: T[] };
```

---

## 4. Read path / disabling inputs

The page-data routes currently send one `submissionEndsAt` per phase
(`groups-page-data`, `finals-page-data`, `room-groups-data`,
`room-finals-data`). For per-match locking the client needs each match's own
`date`, which it already receives. So:

- In [`DailyMatchInput.tsx`](../src/components/common/DailyMatches/DailyMatchInput.tsx)
  and [`DailyMatchFinalInput.tsx`](../src/components/common/DailyMatches/DailyMatchFinalInput.tsx),
  compute `disabled` from `matchLocked(props.date)` instead of (or OR'd with)
  the phase `disabled` prop. The countdown block at lines 122-163 already has
  the `props.date - 10min` fallback wired — point the lock at the same source.
- Use the existing `useInterval(..., 60000)` so a match visibly locks while the
  page is open without a refresh.
- Keep relying on the server `403` as the real guard; the client lock is UX.

---

## 5. Tests

- Unit-test `matchLocked` around the boundary (11 min before = open, 10 min = locked,
  after kickoff = locked).
- Unit-test `partitionByLock` with a mix of locked/writable matches.
- Extend the API route tests: submit a batch straddling the 10-min boundary,
  assert locked matches are rejected/filtered and writable ones persist.
- Keep the Stage 1 characterization tests green — this plan does not touch
  scoring math, only write-eligibility, so they should be unaffected.

---

## 6. Rollback / toggling

Make the policy a single switch rather than a code fork so it can flip without a
deploy if possible:

- Cheapest: an env flag (`DEADLINE_MODE=phase|per-match|both`) read in the shared
  `lib/deadlines` entry. Default `phase` (current behavior). Document in
  `.env.example`.
- The phase columns (`groupSubmissionsEnd`, `finalsSubmissionsEnd`) stay in the
  schema regardless — the "both" mode needs them, and they're the safe default.

---

## 7. Migration checklist

1. [ ] Add `matchLocked` to `utils/date.ts`; delete `getNextTenMinutesDate`.
2. [ ] Add `lib/deadlines/` with `partitionByLock` + env-flag policy resolver.
3. [ ] Update the 4 write routes to enforce per-match (guarded by the flag).
4. [ ] Update `DailyMatchInput` / `DailyMatchFinalInput` disabled logic.
5. [ ] Tests: helper, partition, route boundary cases.
6. [ ] `.env.example` documents `DEADLINE_MODE`.
7. [ ] Verify phase mode still behaves identically (regression).
