// WC 2026 group-stage "fecha" (matchday) boundaries.
//
// Predictions lock per matchday: every match of a fecha closes at that fecha's
// first kickoff, so a player must complete the whole fecha before it begins and
// cannot peek at an early result before predicting a same-fecha match. Across
// fechas, editing stays open ("ir completando fecha a fecha").
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
