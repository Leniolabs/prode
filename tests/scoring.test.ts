import { describe, it, expect } from "vitest";
import {
  matchResultStatus,
  matchFinalResultStatus,
  matchCountriesMatchStatus,
  getAdminMatchWinner,
  getFinalsMatchWinner,
  getFinalsMatchLooser,
  getAdminFinalsMatchWinner,
  getAdminFinalsMatchLooser,
} from "@/utils/points";
import {
  computeGroupMatchPoints,
  computeFinalMatchPoints,
  finalMatchPoints,
} from "@/utils/queries";

import {
  GROUP_MATCH_SCORING,
  FINALS_SCORING,
  RESULT_STATUS,
  FINALS_RESULT_STATUS,
  COUNTRIES_STATUS,
  ADMIN_GROUP_WINNER,
  FINALS_WINNER,
  FINALS_LOOSER,
  ADMIN_FINALS_WINNER,
  ADMIN_FINALS_LOOSER,
} from "@test/fixtures/scoring";

// ---------------------------------------------------------------------------
// Group-match scoring
// ---------------------------------------------------------------------------

describe("computeGroupMatchPoints", () => {
  it.each(GROUP_MATCH_SCORING)("$name", ({ room, userMatches, expected }) => {
    // Cast to mutable to satisfy ProdeRoom type (we only need the three fields)
    const result = computeGroupMatchPoints(room as any, userMatches as any);
    expect(result).toBe(expected);
  });
});

// ---------------------------------------------------------------------------
// Finals scoring — single match  (finalMatchPoints)
// ---------------------------------------------------------------------------

describe("finalMatchPoints", () => {
  it.each(FINALS_SCORING)("$name", ({ room, userMatch, expected }) => {
    const result = finalMatchPoints(room as any, userMatch as any);
    expect(result).toBe(expected);
  });
});

// ---------------------------------------------------------------------------
// Finals scoring — reduce over array  (computeFinalMatchPoints)
// ---------------------------------------------------------------------------

describe("computeFinalMatchPoints", () => {
  it("sums zero matches → 0", () => {
    const result = computeFinalMatchPoints(
      { pointsWinner: 1, pointsGoals: 3, pointsPenal: 5 } as any,
      []
    );
    expect(result).toBe(0);
  });

  it("sums two matches: one exact score + one correct winner → pointsGoals + pointsWinner", () => {
    const room = { pointsWinner: 1, pointsGoals: 3, pointsPenal: 5 } as any;
    const match1 = {
      matchId: "m1",
      goalsLeft: 2,
      goalsRight: 1,
      countryLeftId: "BRA",
      countryRightId: "ARG",
      penaltisLeft: null,
      penaltisRight: null,
      match: {
        id: "m1",
        goalsLeft: 2,
        goalsRight: 1,
        penaltisLeft: null,
        penaltisRight: null,
        countryLeftId: "BRA",
        countryRightId: "ARG",
      },
    };
    const match2 = {
      matchId: "m2",
      goalsLeft: 3,
      goalsRight: 0,
      countryLeftId: "GER",
      countryRightId: "FRA",
      penaltisLeft: null,
      penaltisRight: null,
      match: {
        id: "m2",
        goalsLeft: 2,
        goalsRight: 1,
        penaltisLeft: null,
        penaltisRight: null,
        countryLeftId: "GER",
        countryRightId: "FRA",
      },
    };
    const result = computeFinalMatchPoints(room, [match1, match2] as any);
    expect(result).toBe(4); // 3 + 1
  });

  it("sums two matches: one exact draw+penalties + one no points → pointsPenal", () => {
    const room = { pointsWinner: 1, pointsGoals: 3, pointsPenal: 5 } as any;
    const match1 = {
      matchId: "m1",
      goalsLeft: 1,
      goalsRight: 1,
      countryLeftId: "BRA",
      countryRightId: "ARG",
      penaltisLeft: 4,
      penaltisRight: 3,
      match: {
        id: "m1",
        goalsLeft: 1,
        goalsRight: 1,
        penaltisLeft: 4,
        penaltisRight: 3,
        countryLeftId: "BRA",
        countryRightId: "ARG",
      },
    };
    const match2 = {
      matchId: "m2",
      goalsLeft: 2,
      goalsRight: 1, // wrong
      countryLeftId: "GER",
      countryRightId: "FRA",
      penaltisLeft: null,
      penaltisRight: null,
      match: {
        id: "m2",
        goalsLeft: 0,
        goalsRight: 3,
        penaltisLeft: null,
        penaltisRight: null,
        countryLeftId: "GER",
        countryRightId: "FRA",
      },
    };
    const result = computeFinalMatchPoints(room, [match1, match2] as any);
    expect(result).toBe(5); // 5 + 0
  });
});

// ---------------------------------------------------------------------------
// matchResultStatus
// ---------------------------------------------------------------------------

describe("matchResultStatus", () => {
  it.each(RESULT_STATUS)("$name", ({ match, userMatch, expected }) => {
    const result = matchResultStatus(match as any, userMatch as any);
    expect(result).toBe(expected);
  });
});

// ---------------------------------------------------------------------------
// matchFinalResultStatus
// ---------------------------------------------------------------------------

describe("matchFinalResultStatus", () => {
  it.each(FINALS_RESULT_STATUS)("$name", ({ match, userMatch, expected }) => {
    const result = matchFinalResultStatus(match as any, userMatch as any);
    expect(result).toBe(expected);
  });
});

// ---------------------------------------------------------------------------
// matchCountriesMatchStatus
// ---------------------------------------------------------------------------

describe("matchCountriesMatchStatus", () => {
  it.each(COUNTRIES_STATUS)("$name", ({ match, userMatch, expected }) => {
    const result = matchCountriesMatchStatus(match as any, userMatch as any);
    expect(result).toBe(expected);
  });
});

// ---------------------------------------------------------------------------
// getAdminMatchWinner (groups)
// ---------------------------------------------------------------------------

describe("getAdminMatchWinner", () => {
  it.each(ADMIN_GROUP_WINNER)("$name", ({ match, expected }) => {
    const result = getAdminMatchWinner(match);
    expect(result).toBe(expected);
  });
});

// ---------------------------------------------------------------------------
// getFinalsMatchWinner (user predictions)
// ---------------------------------------------------------------------------

describe("getFinalsMatchWinner", () => {
  it.each(FINALS_WINNER)("$name", ({ match, expected }) => {
    const result = getFinalsMatchWinner(match);
    expect(result).toBe(expected);
  });
});

// ---------------------------------------------------------------------------
// getFinalsMatchLooser (user predictions)
// ---------------------------------------------------------------------------

describe("getFinalsMatchLooser", () => {
  it.each(FINALS_LOOSER)("$name", ({ match, expected }) => {
    const result = getFinalsMatchLooser(match);
    expect(result).toBe(expected);
  });
});

// ---------------------------------------------------------------------------
// getAdminFinalsMatchWinner (actual match result)
// ---------------------------------------------------------------------------

describe("getAdminFinalsMatchWinner", () => {
  it.each(ADMIN_FINALS_WINNER)("$name", ({ match, expected }) => {
    const result = getAdminFinalsMatchWinner(match);
    expect(result).toBe(expected);
  });
});

// ---------------------------------------------------------------------------
// getAdminFinalsMatchLooser (actual match result)
// ---------------------------------------------------------------------------

describe("getAdminFinalsMatchLooser", () => {
  it.each(ADMIN_FINALS_LOOSER)("$name", ({ match, expected }) => {
    const result = getAdminFinalsMatchLooser(match);
    expect(result).toBe(expected);
  });
});
