/**
 * Characterization fixtures for the scoring engine.
 *
 * Each row describes a user-facing scenario a non-engineer can sanity-check.
 * Inputs use only the fields each function actually reads.
 */

import { Match, ProdeRoom, ProdeUserFinalsMatch } from '@/generated/prisma';

// ---------------------------------------------------------------------------
// Shared helpers / minimal stubs
// ---------------------------------------------------------------------------

/** Minimal ProdeRoom with just the three scoring weights. */
type Room = Pick<ProdeRoom, "pointsWinner" | "pointsGoals" | "pointsPenal">;

const DEFAULT_ROOM: Room = {
  pointsWinner: 1,
  pointsGoals: 3,
  pointsPenal: 5,
};

/** Build a minimal Match stub (only the fields the scoring functions read). */
function makeMatch(
  overrides: Partial<
    Pick<
      Match,
      | "goalsLeft"
      | "goalsRight"
      | "penaltisLeft"
      | "penaltisRight"
      | "filled"
      | "countryLeftId"
      | "countryRightId"
    >
  > & { id?: string }
): Match {
  return {
    id: overrides.id ?? "match-1",
    date: new Date("2026-06-01"),
    stage: "GROUP_A",
    goalsLeft: overrides.goalsLeft ?? null,
    goalsRight: overrides.goalsRight ?? null,
    penaltisLeft: overrides.penaltisLeft ?? null,
    penaltisRight: overrides.penaltisRight ?? null,
    filled: overrides.filled ?? false,
    countryLeftId: overrides.countryLeftId ?? "BRA",
    countryRightId: overrides.countryRightId ?? "ARG",
    prodeId: "prode-1",
  } as Match;
}

/** Build a group-match user prediction row. */
function makeGroupUserMatch(
  matchId: string,
  goalsLeft: number,
  goalsRight: number,
  match: Match
) {
  return { matchId, goalsLeft, goalsRight, match };
}

/** Build a finals user-match prediction row. */
function makeFinalUserMatch(
  matchId: string,
  goalsLeft: number,
  goalsRight: number,
  countryLeftId: string,
  countryRightId: string,
  match: Match,
  penaltisLeft?: number | null,
  penaltisRight?: number | null
) {
  return {
    matchId,
    goalsLeft,
    goalsRight,
    countryLeftId,
    countryRightId,
    match,
    penaltisLeft: penaltisLeft ?? null,
    penaltisRight: penaltisRight ?? null,
  };
}

// ---------------------------------------------------------------------------
// GROUP MATCH SCORING  (computeGroupMatchPoints)
// ---------------------------------------------------------------------------

export const GROUP_MATCH_SCORING = [
  {
    name: "user predicts exact score → pointsGoals",
    room: DEFAULT_ROOM,
    userMatches: [
      makeGroupUserMatch(
        "m1",
        2,
        1,
        makeMatch({ goalsLeft: 2, goalsRight: 1, filled: true })
      ),
    ],
    expected: 3,
  },
  {
    name: "user predicts correct winner (left wins) but wrong exact score → pointsWinner",
    room: DEFAULT_ROOM,
    userMatches: [
      makeGroupUserMatch(
        "m1",
        3,
        0,
        makeMatch({ goalsLeft: 2, goalsRight: 1, filled: true })
      ),
    ],
    expected: 1,
  },
  {
    name: "user predicts correct winner (right wins) but wrong exact score → pointsWinner",
    room: DEFAULT_ROOM,
    userMatches: [
      makeGroupUserMatch(
        "m1",
        0,
        2,
        makeMatch({ goalsLeft: 1, goalsRight: 3, filled: true })
      ),
    ],
    expected: 1,
  },
  {
    name: "user predicts correct draw outcome but wrong exact score → pointsWinner",
    room: DEFAULT_ROOM,
    userMatches: [
      makeGroupUserMatch(
        "m1",
        2,
        2,
        makeMatch({ goalsLeft: 1, goalsRight: 1, filled: true })
      ),
    ],
    expected: 1,
  },
  {
    name: "user predicts exact draw score → pointsGoals",
    room: DEFAULT_ROOM,
    userMatches: [
      makeGroupUserMatch(
        "m1",
        1,
        1,
        makeMatch({ goalsLeft: 1, goalsRight: 1, filled: true })
      ),
    ],
    expected: 3,
  },
  {
    name: "user predicts wrong outcome (predicted right wins, left actually wins) → 0 points",
    room: DEFAULT_ROOM,
    userMatches: [
      makeGroupUserMatch(
        "m1",
        0,
        2,
        makeMatch({ goalsLeft: 2, goalsRight: 1, filled: true })
      ),
    ],
    expected: 0,
  },
  {
    name: "user predicts draw but actual match has a winner → 0 points",
    room: DEFAULT_ROOM,
    userMatches: [
      makeGroupUserMatch(
        "m1",
        1,
        1,
        makeMatch({ goalsLeft: 2, goalsRight: 1, filled: true })
      ),
    ],
    expected: 0,
  },
  {
    name: "user predicts a winner but actual match is a draw → 0 points",
    room: DEFAULT_ROOM,
    userMatches: [
      makeGroupUserMatch(
        "m1",
        2,
        1,
        makeMatch({ goalsLeft: 1, goalsRight: 1, filled: true })
      ),
    ],
    expected: 0,
  },
  {
    name: "match not yet filled (goals are null) → 0 points",
    room: DEFAULT_ROOM,
    userMatches: [
      makeGroupUserMatch(
        "m1",
        2,
        1,
        makeMatch({ goalsLeft: null, goalsRight: null, filled: false })
      ),
    ],
    expected: 0,
  },
  {
    name: "no user predictions (empty array) → 0 points",
    room: DEFAULT_ROOM,
    userMatches: [],
    expected: 0,
  },
  {
    name: "two matches, one exact one correct winner → pointsGoals + pointsWinner",
    room: DEFAULT_ROOM,
    userMatches: [
      makeGroupUserMatch(
        "m1",
        2,
        1,
        makeMatch({ id: "m1", goalsLeft: 2, goalsRight: 1, filled: true })
      ),
      makeGroupUserMatch(
        "m2",
        3,
        0,
        makeMatch({ id: "m2", goalsLeft: 1, goalsRight: 0, filled: true })
      ),
    ],
    expected: 4, // 3 + 1
  },
  {
    name: "custom room weights: exact score → pointsGoals from room config",
    room: { pointsWinner: 2, pointsGoals: 5, pointsPenal: 7 },
    userMatches: [
      makeGroupUserMatch(
        "m1",
        2,
        0,
        makeMatch({ goalsLeft: 2, goalsRight: 0, filled: true })
      ),
    ],
    expected: 5,
  },
  {
    name: "custom room weights: correct winner → pointsWinner from room config",
    room: { pointsWinner: 2, pointsGoals: 5, pointsPenal: 7 },
    userMatches: [
      makeGroupUserMatch(
        "m1",
        3,
        0,
        makeMatch({ goalsLeft: 1, goalsRight: 0, filled: true })
      ),
    ],
    expected: 2,
  },
] as const;

// ---------------------------------------------------------------------------
// FINALS SCORING  (finalMatchPoints / computeFinalMatchPoints)
// ---------------------------------------------------------------------------

export const FINALS_SCORING = [
  {
    name: "perfect regulation score (no draw, left wins) → pointsGoals",
    room: DEFAULT_ROOM,
    userMatch: makeFinalUserMatch(
      "m1",
      2,
      1,
      "BRA",
      "ARG",
      makeMatch({
        goalsLeft: 2,
        goalsRight: 1,
        penaltisLeft: null,
        penaltisRight: null,
        countryLeftId: "BRA",
        countryRightId: "ARG",
      })
    ),
    expected: 3,
  },
  {
    name: "perfect regulation score (no draw, right wins) → pointsGoals",
    room: DEFAULT_ROOM,
    userMatch: makeFinalUserMatch(
      "m1",
      0,
      3,
      "BRA",
      "ARG",
      makeMatch({
        goalsLeft: 0,
        goalsRight: 3,
        penaltisLeft: null,
        penaltisRight: null,
        countryLeftId: "BRA",
        countryRightId: "ARG",
      })
    ),
    expected: 3,
  },
  {
    name: "perfect regulation draw with exact penalty score → pointsPenal",
    room: DEFAULT_ROOM,
    userMatch: makeFinalUserMatch(
      "m1",
      1,
      1,
      "BRA",
      "ARG",
      makeMatch({
        goalsLeft: 1,
        goalsRight: 1,
        penaltisLeft: 4,
        penaltisRight: 3,
        countryLeftId: "BRA",
        countryRightId: "ARG",
      }),
      4,
      3
    ),
    expected: 5,
  },
  {
    name: "correct draw 0-0 with exact penalty score → pointsPenal",
    room: DEFAULT_ROOM,
    userMatch: makeFinalUserMatch(
      "m1",
      0,
      0,
      "BRA",
      "ARG",
      makeMatch({
        goalsLeft: 0,
        goalsRight: 0,
        penaltisLeft: 5,
        penaltisRight: 3,
        countryLeftId: "BRA",
        countryRightId: "ARG",
      }),
      5,
      3
    ),
    expected: 5,
  },
  {
    name: "correct regulation winner via goals, wrong exact score → pointsWinner",
    room: DEFAULT_ROOM,
    userMatch: makeFinalUserMatch(
      "m1",
      3,
      0,
      "BRA",
      "ARG",
      makeMatch({
        goalsLeft: 2,
        goalsRight: 1,
        penaltisLeft: null,
        penaltisRight: null,
        countryLeftId: "BRA",
        countryRightId: "ARG",
      })
    ),
    expected: 1,
  },
  {
    name: "correct regulation winner (right wins), wrong exact score → pointsWinner",
    room: DEFAULT_ROOM,
    userMatch: makeFinalUserMatch(
      "m1",
      0,
      2,
      "BRA",
      "ARG",
      makeMatch({
        goalsLeft: 1,
        goalsRight: 3,
        penaltisLeft: null,
        penaltisRight: null,
        countryLeftId: "BRA",
        countryRightId: "ARG",
      })
    ),
    expected: 1,
  },
  {
    name: "user predicts draw (wrong goals) + correct penalty winner (left wins on pens) → pointsWinner",
    room: DEFAULT_ROOM,
    userMatch: makeFinalUserMatch(
      "m1",
      0,
      0, // user predicted 0-0 draw
      "BRA",
      "ARG",
      makeMatch({
        goalsLeft: 1,
        goalsRight: 1, // actual was 1-1
        penaltisLeft: 5,
        penaltisRight: 4,
        countryLeftId: "BRA",
        countryRightId: "ARG",
      }),
      4,
      3 // user says left wins pens (correct side, different score)
    ),
    expected: 1,
  },
  {
    name: "user predicts draw (wrong goals) + correct penalty winner (right wins on pens) → pointsWinner",
    room: DEFAULT_ROOM,
    userMatch: makeFinalUserMatch(
      "m1",
      1,
      1, // user predicted 1-1 draw
      "BRA",
      "ARG",
      makeMatch({
        goalsLeft: 2,
        goalsRight: 2, // actual was 2-2
        penaltisLeft: 3,
        penaltisRight: 5,
        countryLeftId: "BRA",
        countryRightId: "ARG",
      }),
      3,
      4 // user says right wins pens (correct side, different score)
    ),
    expected: 1,
  },
  {
    name: "draw with exact goals + correct penalty winner side but penalty score differs → pointsGoals",
    room: DEFAULT_ROOM,
    userMatch: makeFinalUserMatch(
      "m1",
      1,
      1,
      "BRA",
      "ARG",
      makeMatch({
        goalsLeft: 1,
        goalsRight: 1,
        penaltisLeft: 5,
        penaltisRight: 3,
        countryLeftId: "BRA",
        countryRightId: "ARG",
      }),
      4,
      3 // correct side (left wins) but not exact penalty score
    ),
    expected: 3,
  },
  {
    name: "draw with exact goals + correct penalty winner (right), different penalty count → pointsGoals",
    room: DEFAULT_ROOM,
    userMatch: makeFinalUserMatch(
      "m1",
      0,
      0,
      "BRA",
      "ARG",
      makeMatch({
        goalsLeft: 0,
        goalsRight: 0,
        penaltisLeft: 2,
        penaltisRight: 4,
        countryLeftId: "BRA",
        countryRightId: "ARG",
      }),
      3,
      5 // correct side (right wins) but different count
    ),
    expected: 3,
  },
  {
    name: "incomplete actual data — no goals entered yet → 0 points",
    room: DEFAULT_ROOM,
    userMatch: makeFinalUserMatch(
      "m1",
      2,
      1,
      "BRA",
      "ARG",
      makeMatch({
        goalsLeft: null,
        goalsRight: null,
        countryLeftId: "BRA",
        countryRightId: "ARG",
      })
    ),
    expected: 0,
  },
  {
    name: "actual left wins regulation, user predicts draw + left winning on pens → pointsWinner",
    room: DEFAULT_ROOM,
    userMatch: makeFinalUserMatch(
      "m1",
      1,
      1, // user predicts draw
      "BRA",
      "ARG",
      makeMatch({
        goalsLeft: 2,
        goalsRight: 1, // actual left wins regulation
        countryLeftId: "BRA",
        countryRightId: "ARG",
      }),
      4,
      3 // user says left wins pens (matching eventual winner)
    ),
    expected: 1,
  },
  {
    name: "actual left wins regulation, user predicts draw + right winning on pens (wrong side) → 0 points",
    room: DEFAULT_ROOM,
    userMatch: makeFinalUserMatch(
      "m1",
      0,
      0, // user predicts draw
      "BRA",
      "ARG",
      makeMatch({
        goalsLeft: 3,
        goalsRight: 1, // actual left wins regulation
        countryLeftId: "BRA",
        countryRightId: "ARG",
      }),
      3,
      5 // user says right wins pens (wrong side)
    ),
    expected: 0,
  },
  {
    name: "actual right wins regulation, user predicts draw + right winning on pens → pointsWinner",
    room: DEFAULT_ROOM,
    userMatch: makeFinalUserMatch(
      "m1",
      2,
      2, // user predicts draw
      "BRA",
      "ARG",
      makeMatch({
        goalsLeft: 1,
        goalsRight: 3, // actual right wins regulation
        countryLeftId: "BRA",
        countryRightId: "ARG",
      }),
      3,
      5 // user says right wins pens (matching eventual winner)
    ),
    expected: 1,
  },
  {
    name: "wrong outcome: user predicts left wins, actual is right wins → 0 points",
    room: DEFAULT_ROOM,
    userMatch: makeFinalUserMatch(
      "m1",
      2,
      1,
      "BRA",
      "ARG",
      makeMatch({
        goalsLeft: 1,
        goalsRight: 3,
        penaltisLeft: null,
        penaltisRight: null,
        countryLeftId: "BRA",
        countryRightId: "ARG",
      })
    ),
    expected: 0,
  },
  {
    name: "pinned current behavior: user predicts regulation left win (2-1) but actual is draw resolved by left winning on pens → pointsWinner (gets credit for correct winner side)",
    room: DEFAULT_ROOM,
    userMatch: makeFinalUserMatch(
      "m1",
      2,
      1,
      "BRA",
      "ARG",
      makeMatch({
        goalsLeft: 1,
        goalsRight: 1,
        penaltisLeft: 5,
        penaltisRight: 3,
        countryLeftId: "BRA",
        countryRightId: "ARG",
      })
    ),
    expected: 1, // code awards pointsWinner because user.goalsLeft > user.goalsRight and left wins match
  },
  {
    name: "wrong outcome: user predicts right wins but actual left wins via penalties → 0 points",
    room: DEFAULT_ROOM,
    userMatch: makeFinalUserMatch(
      "m1",
      0,
      1,
      "BRA",
      "ARG",
      makeMatch({
        goalsLeft: 1,
        goalsRight: 1,
        penaltisLeft: 4,
        penaltisRight: 3,
        countryLeftId: "BRA",
        countryRightId: "ARG",
      })
    ),
    expected: 0,
  },
  {
    name: "pinned current behavior, may be a bug: wrong country prediction still scores if goals match, no country check in finalMatchPoints",
    room: DEFAULT_ROOM,
    userMatch: makeFinalUserMatch(
      "m1",
      2,
      1,
      "GER",
      "FRA", // user predicted wrong countries
      makeMatch({
        goalsLeft: 2,
        goalsRight: 1,
        penaltisLeft: null,
        penaltisRight: null,
        countryLeftId: "BRA",
        countryRightId: "ARG",
      })
    ),
    expected: 3, // finalMatchPoints ignores countries; matchFinalResultStatus would say WRONG
  },
  {
    name: "custom room weights: perfect regulation score → custom pointsGoals",
    room: { pointsWinner: 2, pointsGoals: 6, pointsPenal: 10 },
    userMatch: makeFinalUserMatch(
      "m1",
      3,
      1,
      "BRA",
      "ARG",
      makeMatch({
        goalsLeft: 3,
        goalsRight: 1,
        countryLeftId: "BRA",
        countryRightId: "ARG",
      })
    ),
    expected: 6,
  },
  {
    name: "custom room weights: exact draw with exact penalties → custom pointsPenal",
    room: { pointsWinner: 2, pointsGoals: 6, pointsPenal: 10 },
    userMatch: makeFinalUserMatch(
      "m1",
      1,
      1,
      "BRA",
      "ARG",
      makeMatch({
        goalsLeft: 1,
        goalsRight: 1,
        penaltisLeft: 3,
        penaltisRight: 5,
        countryLeftId: "BRA",
        countryRightId: "ARG",
      }),
      3,
      5
    ),
    expected: 10,
  },
  {
    name: "wrong penalty side: actual draw right wins on pens, user predicts draw but left wins on pens → 0 points",
    room: DEFAULT_ROOM,
    userMatch: makeFinalUserMatch(
      "m1",
      1,
      1,
      "BRA",
      "ARG",
      makeMatch({
        goalsLeft: 1,
        goalsRight: 1,
        penaltisLeft: 3,
        penaltisRight: 5, // right wins on pens
        countryLeftId: "BRA",
        countryRightId: "ARG",
      }),
      5,
      3 // user says left wins pens (wrong side)
    ),
    expected: 0,
  },
  {
    name: "pinned current behavior: user predicts regulation right win (0-2) but actual is draw resolved by right winning on pens → pointsWinner",
    room: DEFAULT_ROOM,
    userMatch: makeFinalUserMatch(
      "m1",
      0,
      2, // user predicts right wins in regulation
      "BRA",
      "ARG",
      makeMatch({
        goalsLeft: 1,
        goalsRight: 1,
        penaltisLeft: 3,
        penaltisRight: 5, // right wins on pens
        countryLeftId: "BRA",
        countryRightId: "ARG",
      })
    ),
    expected: 1, // gets credit for correct winner side
  },
  {
    name: "pinned current behavior: actual draw with equal penalty counts (tied pens) → 0 points (degenerate case, cannot happen in real football)",
    room: DEFAULT_ROOM,
    userMatch: makeFinalUserMatch(
      "m1",
      1,
      1,
      "BRA",
      "ARG",
      makeMatch({
        goalsLeft: 1,
        goalsRight: 1,
        penaltisLeft: 4,
        penaltisRight: 4, // equal penalties — degenerate case
        countryLeftId: "BRA",
        countryRightId: "ARG",
      }),
      1,
      1
    ),
    expected: 0,
  },
  {
    name: "actual draw with no penalty info yet (draw but penaltis are null) → 0 points (match incomplete path?)",
    room: DEFAULT_ROOM,
    userMatch: makeFinalUserMatch(
      "m1",
      1,
      1,
      "BRA",
      "ARG",
      makeMatch({
        goalsLeft: 1,
        goalsRight: 1,
        penaltisLeft: null,
        penaltisRight: null,
        countryLeftId: "BRA",
        countryRightId: "ARG",
      }),
      4,
      3
    ),
    expected: 0, // the draw/penalty block falls through to return 0 when penaltis null
  },
] as const;

// ---------------------------------------------------------------------------
// RESULT STATUS  (matchResultStatus)
// ---------------------------------------------------------------------------

export const RESULT_STATUS = [
  {
    name: "exact score predicted → GOALS_MATCH",
    match: {
      goalsLeft: 2 as number | null,
      goalsRight: 1 as number | null,
      filled: true,
    },
    userMatch: { goalsLeft: 2 as number | null, goalsRight: 1 as number | null },
    expected: "GOALS_MATCH" as const,
  },
  {
    name: "exact draw score → GOALS_MATCH",
    match: {
      goalsLeft: 1 as number | null,
      goalsRight: 1 as number | null,
      filled: true,
    },
    userMatch: { goalsLeft: 1 as number | null, goalsRight: 1 as number | null },
    expected: "GOALS_MATCH" as const,
  },
  {
    name: "correct winner predicted (left wins) but wrong score → WINNER_MATCH",
    match: {
      goalsLeft: 2 as number | null,
      goalsRight: 1 as number | null,
      filled: true,
    },
    userMatch: { goalsLeft: 3 as number | null, goalsRight: 0 as number | null },
    expected: "WINNER_MATCH" as const,
  },
  {
    name: "correct winner predicted (right wins) but wrong score → WINNER_MATCH",
    match: {
      goalsLeft: 0 as number | null,
      goalsRight: 2 as number | null,
      filled: true,
    },
    userMatch: { goalsLeft: 1 as number | null, goalsRight: 3 as number | null },
    expected: "WINNER_MATCH" as const,
  },
  {
    name: "correct draw predicted but wrong exact score → WINNER_MATCH",
    match: {
      goalsLeft: 1 as number | null,
      goalsRight: 1 as number | null,
      filled: true,
    },
    userMatch: { goalsLeft: 2 as number | null, goalsRight: 2 as number | null },
    expected: "WINNER_MATCH" as const,
  },
  {
    name: "wrong outcome: predicted left wins, actual right wins → WRONG",
    match: {
      goalsLeft: 1 as number | null,
      goalsRight: 3 as number | null,
      filled: true,
    },
    userMatch: { goalsLeft: 2 as number | null, goalsRight: 0 as number | null },
    expected: "WRONG" as const,
  },
  {
    name: "wrong outcome: predicted draw, actual left wins → WRONG",
    match: {
      goalsLeft: 2 as number | null,
      goalsRight: 1 as number | null,
      filled: true,
    },
    userMatch: { goalsLeft: 1 as number | null, goalsRight: 1 as number | null },
    expected: "WRONG" as const,
  },
  {
    name: "wrong outcome: predicted left wins, actual draw → WRONG",
    match: {
      goalsLeft: 1 as number | null,
      goalsRight: 1 as number | null,
      filled: true,
    },
    userMatch: { goalsLeft: 2 as number | null, goalsRight: 1 as number | null },
    expected: "WRONG" as const,
  },
  {
    name: "match not filled → undefined (no status)",
    match: {
      goalsLeft: 2 as number | null,
      goalsRight: 1 as number | null,
      filled: false,
    },
    userMatch: { goalsLeft: 2 as number | null, goalsRight: 1 as number | null },
    expected: undefined,
  },
  {
    name: "match goals not entered yet (null) → undefined",
    match: {
      goalsLeft: null as number | null,
      goalsRight: null as number | null,
      filled: false,
    },
    userMatch: { goalsLeft: 2 as number | null, goalsRight: 1 as number | null },
    expected: undefined,
  },
  {
    name: "user goals null → undefined",
    match: {
      goalsLeft: 2 as number | null,
      goalsRight: 1 as number | null,
      filled: true,
    },
    userMatch: {
      goalsLeft: null as number | null,
      goalsRight: null as number | null,
    },
    expected: undefined,
  },
] as const;

// ---------------------------------------------------------------------------
// FINALS RESULT STATUS  (matchFinalResultStatus)
// ---------------------------------------------------------------------------

export const FINALS_RESULT_STATUS = [
  {
    name: "exact score, correct countries → GOALS_MATCH",
    match: {
      id: "m1",
      goalsLeft: 2 as number | null,
      goalsRight: 1 as number | null,
      countryLeftId: "BRA" as string | null,
      countryRightId: "ARG" as string | null,
    },
    userMatch: {
      matchId: "m1",
      goalsLeft: 2 as number | null,
      goalsRight: 1 as number | null,
      countryLeftId: "BRA",
      countryRightId: "ARG",
    },
    expected: "GOALS_MATCH" as const,
  },
  {
    name: "correct winner (left wins), wrong score, correct countries → WINNER_MATCH",
    match: {
      id: "m1",
      goalsLeft: 2 as number | null,
      goalsRight: 1 as number | null,
      countryLeftId: "BRA" as string | null,
      countryRightId: "ARG" as string | null,
    },
    userMatch: {
      matchId: "m1",
      goalsLeft: 3 as number | null,
      goalsRight: 0 as number | null,
      countryLeftId: "BRA",
      countryRightId: "ARG",
    },
    expected: "WINNER_MATCH" as const,
  },
  {
    name: "correct draw predicted (0-0 vs 1-1), correct countries → WINNER_MATCH",
    match: {
      id: "m1",
      goalsLeft: 1 as number | null,
      goalsRight: 1 as number | null,
      countryLeftId: "BRA" as string | null,
      countryRightId: "ARG" as string | null,
    },
    userMatch: {
      matchId: "m1",
      goalsLeft: 0 as number | null,
      goalsRight: 0 as number | null,
      countryLeftId: "BRA",
      countryRightId: "ARG",
    },
    expected: "WINNER_MATCH" as const,
  },
  {
    name: "wrong outcome, correct countries → WRONG",
    match: {
      id: "m1",
      goalsLeft: 2 as number | null,
      goalsRight: 1 as number | null,
      countryLeftId: "BRA" as string | null,
      countryRightId: "ARG" as string | null,
    },
    userMatch: {
      matchId: "m1",
      goalsLeft: 0 as number | null,
      goalsRight: 2 as number | null,
      countryLeftId: "BRA",
      countryRightId: "ARG",
    },
    expected: "WRONG" as const,
  },
  {
    name: "wrong country prediction (regardless of score) → WRONG",
    match: {
      id: "m1",
      goalsLeft: 2 as number | null,
      goalsRight: 1 as number | null,
      countryLeftId: "BRA" as string | null,
      countryRightId: "ARG" as string | null,
    },
    userMatch: {
      matchId: "m1",
      goalsLeft: 2 as number | null,
      goalsRight: 1 as number | null, // exact score but wrong countries
      countryLeftId: "GER",
      countryRightId: "FRA",
    },
    expected: "WRONG" as const,
  },
  {
    name: "match countries not set yet → undefined (empty string path via matchCountriesMatchStatus, but here undefined via null check)",
    match: {
      id: "m1",
      goalsLeft: null as number | null,
      goalsRight: null as number | null,
      countryLeftId: null as string | null,
      countryRightId: null as string | null,
    },
    userMatch: {
      matchId: "m1",
      goalsLeft: 2 as number | null,
      goalsRight: 1 as number | null,
      countryLeftId: "BRA",
      countryRightId: "ARG",
    },
    expected: undefined,
  },
  {
    name: "user goals null → undefined",
    match: {
      id: "m1",
      goalsLeft: 2 as number | null,
      goalsRight: 1 as number | null,
      countryLeftId: "BRA" as string | null,
      countryRightId: "ARG" as string | null,
    },
    userMatch: {
      matchId: "m1",
      goalsLeft: null as number | null,
      goalsRight: null as number | null,
      countryLeftId: "BRA",
      countryRightId: "ARG",
    },
    expected: undefined,
  },
  {
    name: "correct right winner, wrong score, correct countries → WINNER_MATCH",
    match: {
      id: "m1",
      goalsLeft: 0 as number | null,
      goalsRight: 3 as number | null,
      countryLeftId: "BRA" as string | null,
      countryRightId: "ARG" as string | null,
    },
    userMatch: {
      matchId: "m1",
      goalsLeft: 1 as number | null,
      goalsRight: 2 as number | null,
      countryLeftId: "BRA",
      countryRightId: "ARG",
    },
    expected: "WINNER_MATCH" as const,
  },
] as const;

// ---------------------------------------------------------------------------
// COUNTRIES MATCH STATUS  (matchCountriesMatchStatus)
// ---------------------------------------------------------------------------

export const COUNTRIES_STATUS = [
  {
    name: "both countries match exactly → MATCH",
    match: { id: "m1", countryLeftId: "BRA" as string | null, countryRightId: "ARG" as string | null },
    userMatch: { matchId: "m1", countryLeftId: "BRA", countryRightId: "ARG" },
    expected: "MATCH" as const,
  },
  {
    name: "left country differs → WRONG",
    match: { id: "m1", countryLeftId: "BRA" as string | null, countryRightId: "ARG" as string | null },
    userMatch: { matchId: "m1", countryLeftId: "GER", countryRightId: "ARG" },
    expected: "WRONG" as const,
  },
  {
    name: "right country differs → WRONG",
    match: { id: "m1", countryLeftId: "BRA" as string | null, countryRightId: "ARG" as string | null },
    userMatch: { matchId: "m1", countryLeftId: "BRA", countryRightId: "FRA" },
    expected: "WRONG" as const,
  },
  {
    name: "both countries differ → WRONG",
    match: { id: "m1", countryLeftId: "BRA" as string | null, countryRightId: "ARG" as string | null },
    userMatch: { matchId: "m1", countryLeftId: "GER", countryRightId: "FRA" },
    expected: "WRONG" as const,
  },
  {
    name: "match countries not yet set (both null) → empty string",
    match: { id: "m1", countryLeftId: null as string | null, countryRightId: null as string | null },
    userMatch: { matchId: "m1", countryLeftId: "BRA", countryRightId: "ARG" },
    expected: "" as const,
  },
  {
    name: "pinned current behavior, may be a bug: only left country null → WRONG instead of empty string",
    match: { id: "m1", countryLeftId: null as string | null, countryRightId: "ARG" as string | null },
    userMatch: { matchId: "m1", countryLeftId: "BRA", countryRightId: "ARG" },
    expected: "WRONG" as const, // only skips the early return if BOTH are null; one null still falls to mismatch check
  },
] as const;

// ---------------------------------------------------------------------------
// ADMIN GROUP WINNER  (getAdminMatchWinner)
// ---------------------------------------------------------------------------

export const ADMIN_GROUP_WINNER = [
  {
    name: "left team wins → left countryId returned",
    match: { goalsLeft: 3, goalsRight: 1, countryLeftId: "BRA", countryRightId: "ARG" },
    expected: "BRA",
  },
  {
    name: "right team wins → right countryId returned",
    match: { goalsLeft: 0, goalsRight: 2, countryLeftId: "BRA", countryRightId: "ARG" },
    expected: "ARG",
  },
  {
    name: "draw → undefined (no winner in group stage)",
    match: { goalsLeft: 1, goalsRight: 1, countryLeftId: "BRA", countryRightId: "ARG" },
    expected: undefined,
  },
  {
    name: "goals not entered yet (null) → undefined",
    match: { goalsLeft: null as number | null | undefined, goalsRight: null as number | null | undefined, countryLeftId: "BRA", countryRightId: "ARG" },
    expected: undefined,
  },
  {
    name: "countries not set → undefined",
    match: { goalsLeft: 2, goalsRight: 1, countryLeftId: undefined as string | undefined, countryRightId: undefined as string | undefined },
    expected: undefined,
  },
  {
    name: "0-0 draw → undefined",
    match: { goalsLeft: 0, goalsRight: 0, countryLeftId: "BRA", countryRightId: "ARG" },
    expected: undefined,
  },
  {
    name: "left team wins 1-0 → left countryId returned",
    match: { goalsLeft: 1, goalsRight: 0, countryLeftId: "GER", countryRightId: "FRA" },
    expected: "GER",
  },
] as const;

// ---------------------------------------------------------------------------
// FINALS WINNER (user predictions)  (getFinalsMatchWinner)
// ---------------------------------------------------------------------------

export const FINALS_WINNER = [
  {
    name: "user predicts left wins in regulation → left countryId",
    match: { userGoalsLeft: 2, userGoalsRight: 1, userCountryLeftId: "BRA", userCountryRightId: "ARG", userPenaltisLeft: null as number | null, userPenaltisRight: null as number | null },
    expected: "BRA",
  },
  {
    name: "user predicts right wins in regulation → right countryId",
    match: { userGoalsLeft: 0, userGoalsRight: 2, userCountryLeftId: "BRA", userCountryRightId: "ARG", userPenaltisLeft: null as number | null, userPenaltisRight: null as number | null },
    expected: "ARG",
  },
  {
    name: "user predicts draw with left winning on penalties → left countryId",
    match: { userGoalsLeft: 1, userGoalsRight: 1, userCountryLeftId: "BRA", userCountryRightId: "ARG", userPenaltisLeft: 5 as number | null, userPenaltisRight: 3 as number | null },
    expected: "BRA",
  },
  {
    name: "user predicts draw with right winning on penalties → right countryId",
    match: { userGoalsLeft: 0, userGoalsRight: 0, userCountryLeftId: "BRA", userCountryRightId: "ARG", userPenaltisLeft: 3 as number | null, userPenaltisRight: 5 as number | null },
    expected: "ARG",
  },
  {
    name: "user predicts draw but no penalty info → undefined",
    match: { userGoalsLeft: 1, userGoalsRight: 1, userCountryLeftId: "BRA", userCountryRightId: "ARG", userPenaltisLeft: null as number | null, userPenaltisRight: null as number | null },
    expected: undefined,
  },
  {
    name: "user prediction missing goals (null) → undefined",
    match: { userGoalsLeft: null as number | null, userGoalsRight: null as number | null, userCountryLeftId: "BRA", userCountryRightId: "ARG", userPenaltisLeft: null as number | null, userPenaltisRight: null as number | null },
    expected: undefined,
  },
  {
    name: "user prediction missing countries → undefined",
    match: { userGoalsLeft: 2, userGoalsRight: 1, userCountryLeftId: undefined as string | undefined, userCountryRightId: undefined as string | undefined, userPenaltisLeft: null as number | null, userPenaltisRight: null as number | null },
    expected: undefined,
  },
  {
    name: "draw with equal penalty goals (tie in penalties — no winner declared) → undefined",
    match: { userGoalsLeft: 1, userGoalsRight: 1, userCountryLeftId: "BRA", userCountryRightId: "ARG", userPenaltisLeft: 3 as number | null, userPenaltisRight: 3 as number | null },
    expected: undefined,
  },
  {
    name: "draw with penalty count of 0 for both (0-0 penalties) → undefined (penalty tie, no winner)",
    match: { userGoalsLeft: 0, userGoalsRight: 0, userCountryLeftId: "BRA", userCountryRightId: "ARG", userPenaltisLeft: 0 as number | null, userPenaltisRight: 0 as number | null },
    expected: undefined,
  },
] as const;

// ---------------------------------------------------------------------------
// FINALS LOOSER (user predictions)  (getFinalsMatchLooser)
// ---------------------------------------------------------------------------

export const FINALS_LOOSER = [
  {
    name: "user predicts left wins in regulation → right is the looser",
    match: { userGoalsLeft: 2, userGoalsRight: 1, userCountryLeftId: "BRA", userCountryRightId: "ARG", userPenaltisLeft: null as number | null, userPenaltisRight: null as number | null },
    expected: "ARG",
  },
  {
    name: "user predicts right wins in regulation → left is the looser",
    match: { userGoalsLeft: 1, userGoalsRight: 3, userCountryLeftId: "BRA", userCountryRightId: "ARG", userPenaltisLeft: null as number | null, userPenaltisRight: null as number | null },
    expected: "BRA",
  },
  {
    name: "draw with left winning on penalties → right is the looser",
    match: { userGoalsLeft: 1, userGoalsRight: 1, userCountryLeftId: "BRA", userCountryRightId: "ARG", userPenaltisLeft: 5 as number | null, userPenaltisRight: 3 as number | null },
    expected: "ARG",
  },
  {
    name: "draw with right winning on penalties → left is the looser",
    match: { userGoalsLeft: 0, userGoalsRight: 0, userCountryLeftId: "BRA", userCountryRightId: "ARG", userPenaltisLeft: 3 as number | null, userPenaltisRight: 5 as number | null },
    expected: "BRA",
  },
  {
    name: "draw but no penalty info → undefined",
    match: { userGoalsLeft: 1, userGoalsRight: 1, userCountryLeftId: "BRA", userCountryRightId: "ARG", userPenaltisLeft: null as number | null, userPenaltisRight: null as number | null },
    expected: undefined,
  },
  {
    name: "prediction missing goals (null) → undefined",
    match: { userGoalsLeft: null as number | null, userGoalsRight: null as number | null, userCountryLeftId: "BRA", userCountryRightId: "ARG", userPenaltisLeft: null as number | null, userPenaltisRight: null as number | null },
    expected: undefined,
  },
  {
    name: "prediction missing countries → undefined",
    match: { userGoalsLeft: 1, userGoalsRight: 0, userCountryLeftId: undefined as string | undefined, userCountryRightId: undefined as string | undefined, userPenaltisLeft: null as number | null, userPenaltisRight: null as number | null },
    expected: undefined,
  },
  {
    name: "draw with equal penalty count (penalty tie, no looser declared) → undefined",
    match: { userGoalsLeft: 1, userGoalsRight: 1, userCountryLeftId: "BRA", userCountryRightId: "ARG", userPenaltisLeft: 4 as number | null, userPenaltisRight: 4 as number | null },
    expected: undefined,
  },
] as const;

// ---------------------------------------------------------------------------
// ADMIN FINALS WINNER (actual match result)  (getAdminFinalsMatchWinner)
// ---------------------------------------------------------------------------

export const ADMIN_FINALS_WINNER = [
  {
    name: "left wins in regulation → left countryId",
    match: { goalsLeft: 2, goalsRight: 1, countryLeftId: "BRA", countryRightId: "ARG", penaltisLeft: null as number | null, penaltisRight: null as number | null },
    expected: "BRA",
  },
  {
    name: "right wins in regulation → right countryId",
    match: { goalsLeft: 0, goalsRight: 3, countryLeftId: "BRA", countryRightId: "ARG", penaltisLeft: null as number | null, penaltisRight: null as number | null },
    expected: "ARG",
  },
  {
    name: "draw — left wins on penalties → left countryId",
    match: { goalsLeft: 1, goalsRight: 1, countryLeftId: "BRA", countryRightId: "ARG", penaltisLeft: 5 as number | null, penaltisRight: 3 as number | null },
    expected: "BRA",
  },
  {
    name: "draw — right wins on penalties → right countryId",
    match: { goalsLeft: 0, goalsRight: 0, countryLeftId: "BRA", countryRightId: "ARG", penaltisLeft: 3 as number | null, penaltisRight: 5 as number | null },
    expected: "ARG",
  },
  {
    name: "draw but no penalty info yet → undefined",
    match: { goalsLeft: 1, goalsRight: 1, countryLeftId: "BRA", countryRightId: "ARG", penaltisLeft: null as number | null, penaltisRight: null as number | null },
    expected: undefined,
  },
  {
    name: "goals not entered (null) → undefined",
    match: { goalsLeft: null as number | null, goalsRight: null as number | null, countryLeftId: "BRA", countryRightId: "ARG", penaltisLeft: null as number | null, penaltisRight: null as number | null },
    expected: undefined,
  },
  {
    name: "countries not set → undefined",
    match: { goalsLeft: 2, goalsRight: 1, countryLeftId: undefined as string | undefined, countryRightId: undefined as string | undefined, penaltisLeft: null as number | null, penaltisRight: null as number | null },
    expected: undefined,
  },
  {
    name: "draw with equal penalty count (penalty tie) → undefined",
    match: { goalsLeft: 1, goalsRight: 1, countryLeftId: "BRA", countryRightId: "ARG", penaltisLeft: 3 as number | null, penaltisRight: 3 as number | null },
    expected: undefined,
  },
] as const;

// ---------------------------------------------------------------------------
// ADMIN FINALS LOOSER (actual match result)  (getAdminFinalsMatchLooser)
// ---------------------------------------------------------------------------

export const ADMIN_FINALS_LOOSER = [
  {
    name: "left wins in regulation → right is the looser",
    match: { goalsLeft: 2, goalsRight: 0, countryLeftId: "BRA", countryRightId: "ARG", penaltisLeft: null as number | null, penaltisRight: null as number | null },
    expected: "ARG",
  },
  {
    name: "right wins in regulation → left is the looser",
    match: { goalsLeft: 1, goalsRight: 3, countryLeftId: "BRA", countryRightId: "ARG", penaltisLeft: null as number | null, penaltisRight: null as number | null },
    expected: "BRA",
  },
  {
    name: "draw — left wins on penalties → right is the looser",
    match: { goalsLeft: 2, goalsRight: 2, countryLeftId: "BRA", countryRightId: "ARG", penaltisLeft: 4 as number | null, penaltisRight: 2 as number | null },
    expected: "ARG",
  },
  {
    name: "draw — right wins on penalties → left is the looser",
    match: { goalsLeft: 1, goalsRight: 1, countryLeftId: "BRA", countryRightId: "ARG", penaltisLeft: 2 as number | null, penaltisRight: 4 as number | null },
    expected: "BRA",
  },
  {
    name: "draw but no penalty info → undefined",
    match: { goalsLeft: 1, goalsRight: 1, countryLeftId: "BRA", countryRightId: "ARG", penaltisLeft: null as number | null, penaltisRight: null as number | null },
    expected: undefined,
  },
  {
    name: "goals not entered (null) → undefined",
    match: { goalsLeft: null as number | null, goalsRight: null as number | null, countryLeftId: "BRA", countryRightId: "ARG", penaltisLeft: null as number | null, penaltisRight: null as number | null },
    expected: undefined,
  },
  {
    name: "countries not set → undefined",
    match: { goalsLeft: 0, goalsRight: 1, countryLeftId: undefined as string | undefined, countryRightId: undefined as string | undefined, penaltisLeft: null as number | null, penaltisRight: null as number | null },
    expected: undefined,
  },
  {
    name: "draw with equal penalty count (penalty tie) → undefined",
    match: { goalsLeft: 0, goalsRight: 0, countryLeftId: "BRA", countryRightId: "ARG", penaltisLeft: 5 as number | null, penaltisRight: 5 as number | null },
    expected: undefined,
  },
] as const;
