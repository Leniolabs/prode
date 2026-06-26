// WC 2026 group-stage "fecha" (matchday) boundaries.
//
// Group predictions lock per match at kickoff (see groupMatchLockTime in
// utils/date.ts): each match closes individually the moment it starts, so later
// same-fecha matches stay editable until their own kickoff. These boundaries are
// no longer used as block-lock deadlines; they remain as fecha metadata and as a
// sanity guard for pre-tournament dates.
//
// Each entry is the first kickoff (UTC) of its fecha. Derived from the seeded
// fixture (prisma/seed/fixture.ts): the 72 group matches split 24/24/24 across
// these three boundaries with no overlap. If the fixture changes, re-verify.
//
//   Fecha 1: 2026-06-11 -> first kickoff 19:00Z (MEX-RSA)
//   Fecha 2: 2026-06-18 -> first kickoff 16:00Z
//   Fecha 3: 2026-06-24 -> first kickoff 19:00Z
//
// Ascending order is required by groupMatchLockTime (it scans for the greatest
// boundary <= a match date).
export const GROUP_MATCHDAY_DEADLINES: Date[] = [
  new Date("2026-06-11T19:00:00.000Z"),
  new Date("2026-06-18T16:00:00.000Z"),
  new Date("2026-06-24T19:00:00.000Z"),
];

// WC 2026 finals phase: predictions lock per match at kickoff (see
// finalsMatchLockTime / isFinalsMatchLocked in utils/date.ts), the same way
// group matches lock individually. Each knockout match closes the moment it
// starts, so later same-tier matches stay editable until their own kickoff.
// There is no tier-level block deadline.
