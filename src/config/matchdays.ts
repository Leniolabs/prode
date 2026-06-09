import type { FinalsStageGroup } from "@/utils/finals";

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

// WC 2026 finals-phase tier deadlines.
//
// Finals predictions lock per knockout tier, the same way group predictions lock
// per fecha: every match of a tier closes at that tier's first kickoff, so a
// player must complete the whole tier before it begins and cannot peek at an
// early result before predicting a same-tier match. Across tiers, editing stays
// open ("ir completando ronda a ronda"): once 16avos kicks off only 16avos
// locks, 8avos stays open until its own first kickoff, and so on through the
// final.
//
// Each entry is the first kickoff (UTC) of its tier, derived from the seeded
// bracket (prisma/seed/bracket.ts) as the earliest match date in the tier. The
// FINAL tier groups THIRD_PLACE and FINALS; its deadline is the earlier of the
// two (THIRD_PLACE). If the bracket changes, re-verify.
//
//   FINALS_16 (Round of 32) -> 2026-06-28 19:00Z (FINALS_16_1)
//   FINALS_8  (Round of 16) -> 2026-07-04 17:00Z (FINALS_8_2)
//   FINALS_4  (Quarters)    -> 2026-07-09 20:00Z (FINALS_4_1)
//   FINALS_2  (Semis)       -> 2026-07-14 19:00Z (FINALS_2_1)
//   FINAL     (Final + 3rd) -> 2026-07-18 21:00Z (THIRD_PLACE)
export const FINALS_TIER_DEADLINES: Record<FinalsStageGroup, Date> = {
  FINALS_16: new Date("2026-06-28T19:00:00.000Z"),
  FINALS_8: new Date("2026-07-04T17:00:00.000Z"),
  FINALS_4: new Date("2026-07-09T20:00:00.000Z"),
  FINALS_2: new Date("2026-07-14T19:00:00.000Z"),
  FINAL: new Date("2026-07-18T21:00:00.000Z"),
};
